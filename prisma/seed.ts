/**
 * Seed script for `trn_distribution_reward`.
 *
 * Loads the whitelist from `prisma/data/distribution-whitelist.json`,
 * pre-validates every row, and then idempotently upserts each entry
 * into the distribution table.
 *
 * Idempotency + preservation (Requirement 2.5, 2.6):
 *   `update: {}` intentionally leaves any pre-existing row untouched —
 *   `count`, `is_claimed`, `claimed_at`, `claim_tx_id` are preserved.
 *
 * Run with: `npx prisma db seed` (after task 2.3 wires package.json).
 */

import { PrismaClient } from '@prisma/client';

import whitelist from './data/distribution-whitelist.json';

const ADDRESS_REGEX = /^0x[a-f0-9]{40}$/;

interface WhitelistEntry {
  address: string;
  count: number;
}

interface NormalizedEntry {
  address: string;
  count: number;
}

/**
 * Validate the entire whitelist up front. Throws on the first invalid
 * row so no DB writes happen on a bad input file.
 */
function validateWhitelist(entries: WhitelistEntry[]): NormalizedEntry[] {
  return entries.map((entry, index) => {
    if (!entry || typeof entry.address !== 'string') {
      throw new Error(
        `Invalid whitelist entry at index ${index}: missing or non-string address`,
      );
    }

    const address = entry.address.toLowerCase();

    if (!ADDRESS_REGEX.test(address)) {
      throw new Error(
        `Invalid address in whitelist at index ${index}: "${entry.address}"`,
      );
    }

    if (!Number.isInteger(entry.count) || entry.count < 1) {
      throw new Error(
        `Invalid count for ${address} (index ${index}): ${String(entry.count)}`,
      );
    }

    return { address, count: entry.count };
  });
}

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const entries = validateWhitelist(whitelist as WhitelistEntry[]);

  // eslint-disable-next-line no-console
  console.log(
    `[seed] Validated ${entries.length} whitelist entries, starting upserts…`,
  );

  for (const { address, count } of entries) {
    await prisma.trn_distribution_reward.upsert({
      where: { address },
      // Preserve pre-existing rows (count, is_claimed, claimed_at, claim_tx_id).
      update: {},
      create: {
        address,
        count,
        is_claimed: false,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] Done. Upserted ${entries.length} rows.`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
