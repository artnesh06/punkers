/**
 * Generate Distribution Whitelist
 *
 * One-off script that produces `prisma/data/distribution-whitelist.json` from
 * the production DB. The whitelist is defined as the set of wallets that have
 * at least one `mst_staker` row updated after 2026-05-04, each tagged with the
 * number of such rows (i.e. the NFT count used for the reward calculation).
 *
 * Equivalent SQL:
 *   SELECT mu.address, COUNT(1) AS count
 *   FROM mst_staker ms
 *   LEFT JOIN mst_users mu ON mu.id = ms."userId"
 *   WHERE ms."updatedAt" > '2026-05-04'
 *   GROUP BY mu.address;
 *
 * Run with:
 *   npx tsx scripts/generate-distribution-whitelist.ts
 *
 * The file is committed for auditability.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const ADDRESS_REGEX = /^0x[a-f0-9]{40}$/;
const OUTPUT_DIR = path.resolve(process.cwd(), 'prisma', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'distribution-whitelist.json');
const CUTOFF = '2026-05-04';

interface RawRow {
  address: string | null;
  count: bigint | number;
}

interface WhitelistEntry {
  address: string;
  count: number;
}

async function main(): Promise<void> {
  console.log('📥 Querying staker snapshot from database...');

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT mu.address AS address, COUNT(1) AS count
    FROM mst_staker ms
    LEFT JOIN mst_users mu ON mu.id = ms."userId"
    WHERE ms."updatedAt" > ${CUTOFF}::timestamp
    GROUP BY mu.address
  `;

  console.log(`  Raw rows returned: ${rows.length}`);

  const entries: WhitelistEntry[] = [];

  for (const row of rows) {
    if (row.address === null || row.address === undefined) {
      console.warn('  ⚠ Skipping row with null address');
      continue;
    }

    const address = row.address.toLowerCase();
    const count = Number(row.count);

    if (!ADDRESS_REGEX.test(address)) {
      throw new Error(
        `Invalid address format after lowercasing: "${row.address}" → "${address}"`
      );
    }

    if (!Number.isInteger(count) || count < 1) {
      throw new Error(
        `Invalid count for address ${address}: ${String(row.count)} (parsed as ${count})`
      );
    }

    entries.push({ address, count });
  }

  entries.sort((a, b) => (a.address < b.address ? -1 : a.address > b.address ? 1 : 0));

  // Sanity: guarantee uniqueness (SQL GROUP BY should already ensure this).
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.address)) {
      throw new Error(`Duplicate address found after grouping: ${entry.address}`);
    }
    seen.add(entry.address);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`  Created directory: ${OUTPUT_DIR}`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(entries, null, 2) + '\n', 'utf-8');

  const counts = entries.map((e) => e.count);
  const min = counts.length ? Math.min(...counts) : 0;
  const max = counts.length ? Math.max(...counts) : 0;
  const total = counts.reduce((sum, c) => sum + c, 0);

  console.log(`\n✅ Wrote ${entries.length} entries to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`   Count min: ${min}`);
  console.log(`   Count max: ${max}`);
  console.log(`   Count sum: ${total}`);
}

main()
  .catch((err) => {
    console.error('❌ Failed to generate distribution whitelist:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
