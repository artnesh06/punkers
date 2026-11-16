/**
 * Debug utility: inspect why a wallet is (not) eligible for the reward
 * distribution snapshot.
 *
 * Run with:
 *   npx tsx scripts/check-wallet-eligibility.ts 0x9a299b9aaa23198589e284f269bb3a546acfc137
 */

import { PrismaClient } from '@prisma/client';

// Load .env if dotenv is installed; otherwise rely on Prisma's built-in
// `.env` autoloading. This script is run locally so we don't want a hard
// dependency on dotenv.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
} catch {
  /* optional dep — ignore */
}

const prisma = new PrismaClient();
const CUTOFF = '2026-05-04';

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error('Usage: npx tsx scripts/check-wallet-eligibility.ts <0x...>');
    process.exit(1);
  }
  const address = raw.toLowerCase();

  console.log(`Checking wallet: ${address}\n`);

  // 1. User row?
  const user = await prisma.mst_users.findUnique({
    where: { address },
    select: { id: true, address: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    console.log('❌ No mst_users row for this address.');
    console.log('   → Wallet never authenticated / exists in the app.');
    return;
  }
  console.log('✅ mst_users row exists:');
  console.log(`   id:        ${user.id}`);
  console.log(`   createdAt: ${user.createdAt.toISOString()}`);
  console.log(`   updatedAt: ${user.updatedAt.toISOString()}\n`);

  // 2. All staker rows
  const allStakers = await prisma.mst_staker.findMany({
    where: { userId: user.id },
    select: { id: true, createdAt: true, updatedAt: true, isStaked: true },
    orderBy: { updatedAt: 'desc' },
  });
  console.log(`Total mst_staker rows: ${allStakers.length}`);

  // 3. Stakers that satisfy the whitelist filter
  const recent = allStakers.filter((s) => s.updatedAt > new Date(CUTOFF));
  console.log(`  … with updatedAt > ${CUTOFF}: ${recent.length}`);
  console.log(`  … currently isStaked=true   : ${allStakers.filter((s) => s.isStaked).length}`);

  if (allStakers.length > 0) {
    console.log('\nMost recent 5 staker rows (by updatedAt):');
    for (const s of allStakers.slice(0, 5)) {
      const flag = s.updatedAt > new Date(CUTOFF) ? '✅' : '  ';
      console.log(
        `  ${flag} updatedAt=${s.updatedAt.toISOString()} isStaked=${s.isStaked}`,
      );
    }
  }

  // 4. Distribution row?
  const dist = await prisma.trn_distribution_reward.findUnique({
    where: { address },
  });
  console.log('\nDistribution row:');
  if (dist) {
    console.log(
      `  ✅ count=${dist.count}, is_claimed=${dist.is_claimed}, claimed_at=${dist.claimed_at?.toISOString() ?? 'null'}`,
    );
  } else {
    console.log('  ❌ Not in trn_distribution_reward');
  }

  // 5. Verdict
  console.log('\n--- Verdict ---');
  if (dist) {
    console.log(`Eligible. Reward = ${dist.count} × 10000 = ${dist.count * 10000} $PUNK`);
  } else if (recent.length === 0) {
    console.log(
      `Not eligible. Wallet has 0 mst_staker rows updated after ${CUTOFF}.`,
    );
    console.log(
      `The whitelist was built from the query:`,
    );
    console.log(
      `  SELECT address, COUNT(1) FROM mst_staker JOIN mst_users ON … WHERE updatedAt > '${CUTOFF}' GROUP BY address`,
    );
    console.log(
      `If you think this wallet SHOULD be eligible, verify (a) the cutoff date, or (b) whether its stake activity happened before the cutoff.`,
    );
  } else {
    console.log(
      `Wallet has ${recent.length} recent mst_staker rows but is missing from trn_distribution_reward.`,
    );
    console.log(
      `→ Run the seed again: npx tsx scripts/generate-distribution-whitelist.ts && npx prisma db seed`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
