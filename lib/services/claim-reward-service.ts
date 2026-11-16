/**
 * Reward Distribution Claim — service layer
 *
 * This module exposes the building blocks used by the
 * `/api/claim-reward/*` routes and the `/claim-reward` UI:
 *
 *  - Shared constants (reward unit, message prefix, signature TTL, max length)
 *  - `ClaimMessageError`: typed error thrown by `parseClaimMessage`
 *  - `parseClaimMessage`: validates and extracts the Unix timestamp from a
 *    SIWE-style claim message
 *  - `ClaimStatus`: response shape for claim-eligibility lookups
 *  - `getClaimStatus`: resolves claim eligibility for a wallet address
 *
 * `processClaim` will be implemented in task 5.2.
 */

import { prisma } from '@/lib/prisma';

/** Amount of $PUNK awarded per eligible NFT. */
export const REWARD_UNIT = 10_000;

/** Required literal substring that every claim message must contain. */
export const CLAIM_MESSAGE_PREFIX = 'Claim Reward Distribution';

/** Maximum allowed age of a claim signature (5 minutes, in milliseconds). */
export const CLAIM_SIGNATURE_TTL_MS = 5 * 60 * 1000;

/** Maximum allowed length of the claim message body (in characters). */
export const CLAIM_MESSAGE_MAX_LENGTH = 512;

/**
 * Reasons `parseClaimMessage` can reject an input message.
 *
 *  - `TOO_LONG`          — message exceeds `CLAIM_MESSAGE_MAX_LENGTH`
 *  - `MISSING_PREFIX`    — message does not contain `CLAIM_MESSAGE_PREFIX`
 *  - `MISSING_ADDRESS`   — message does not contain the expected lowercased address
 *  - `MISSING_TIMESTAMP` — message does not contain a `Timestamp: <unix seconds>` line
 */
export type ClaimMessageErrorCode =
  | 'TOO_LONG'
  | 'MISSING_PREFIX'
  | 'MISSING_ADDRESS'
  | 'MISSING_TIMESTAMP';

/**
 * Error thrown by `parseClaimMessage` when the supplied claim message is
 * malformed. The API route handler uses the presence of this error class to
 * emit the `400 "Invalid claim message"` response required by Requirement 4.5
 * and 9.3.
 */
export class ClaimMessageError extends Error {
  public readonly code: ClaimMessageErrorCode;

  constructor(code: ClaimMessageErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ClaimMessageError';
    this.code = code;
    // Maintain a correct prototype chain across transpilation targets.
    Object.setPrototypeOf(this, ClaimMessageError.prototype);
  }
}

/**
 * Regex used to extract the `Timestamp:` line from the claim message.
 *
 * - The `m` flag enables multiline matching so `^` / `$` bind to line
 *   boundaries rather than string boundaries.
 * - `\s*` after the colon allows the space produced by `buildClaimMessage`
 *   (and any other whitespace the wallet may have introduced) before the
 *   digits.
 * - `\s*$` tolerates trailing whitespace on the line, most importantly the
 *   `\r` character that is part of a CRLF (`\r\n`) line ending.
 */
const TIMESTAMP_LINE_REGEX = /^Timestamp:\s*(\d+)\s*$/m;

/**
 * Parses and validates a claim message used for reward distribution.
 *
 * The caller is expected to pass `address.toLowerCase()` as
 * `expectedLowerAddress` — this function performs a case-sensitive substring
 * match and does NOT lowercase the message or the expected address itself.
 *
 * On success it returns the parsed `Timestamp:` value converted from Unix
 * seconds to Unix milliseconds so the caller can compare it against
 * `Date.now()` with `CLAIM_SIGNATURE_TTL_MS`.
 *
 * @param message              The raw claim message signed by the wallet.
 * @param expectedLowerAddress The already-lowercased wallet address that must
 *                             appear as a substring of `message`.
 * @returns                    `{ timestampMs }` — Unix milliseconds parsed
 *                             from the `Timestamp:` line.
 * @throws {ClaimMessageError} with `code` set to `TOO_LONG`, `MISSING_PREFIX`,
 *                             `MISSING_ADDRESS`, or `MISSING_TIMESTAMP`.
 */
export function parseClaimMessage(
  message: string,
  expectedLowerAddress: string,
): { timestampMs: number } {
  if (message.length > CLAIM_MESSAGE_MAX_LENGTH) {
    throw new ClaimMessageError(
      'TOO_LONG',
      `Claim message exceeds ${CLAIM_MESSAGE_MAX_LENGTH} characters`,
    );
  }

  if (!message.includes(CLAIM_MESSAGE_PREFIX)) {
    throw new ClaimMessageError(
      'MISSING_PREFIX',
      `Claim message is missing the required prefix "${CLAIM_MESSAGE_PREFIX}"`,
    );
  }

  if (!message.includes(expectedLowerAddress)) {
    throw new ClaimMessageError(
      'MISSING_ADDRESS',
      'Claim message does not contain the expected wallet address',
    );
  }

  const match = TIMESTAMP_LINE_REGEX.exec(message);
  if (!match) {
    throw new ClaimMessageError(
      'MISSING_TIMESTAMP',
      'Claim message is missing a valid "Timestamp:" line',
    );
  }

  const timestampSeconds = Number(match[1]);
  return { timestampMs: timestampSeconds * 1000 };
}

/**
 * Shape of a claim-status lookup result. Mirrors the JSON body returned by
 * `GET /api/claim-reward/status` (minus the `success` envelope which is
 * added by the route handler).
 */
export interface ClaimStatus {
  eligible: boolean;
  address: string;
  count: number;
  rewardAmount: number;
  isClaimed: boolean;
  claimedAt: string | null;
}

/**
 * Resolves the claim eligibility for a given wallet address.
 *
 * The address is normalized to lowercase before being used as the lookup
 * key on `trn_distribution_reward`. When the address is present in the
 * distribution table, the returned object reports `eligible: true` along
 * with the whitelisted `count`, the computed `rewardAmount` (`count *
 * REWARD_UNIT`), and the current `isClaimed` / `claimedAt` state. When the
 * address is not whitelisted, a non-eligible zero-valued result is returned
 * so the caller can render a "not eligible" state without special-casing
 * missing rows.
 *
 * This function does not catch database errors. The caller is expected to
 * translate thrown errors into the `500 "Failed to fetch claim status"`
 * response required by Requirement 3.7.
 *
 * @param rawAddress The wallet address as received from the request (any
 *                   casing); normalization is handled internally.
 */
export async function getClaimStatus(rawAddress: string): Promise<ClaimStatus> {
  const address = rawAddress.toLowerCase();

  const row = await prisma.trn_distribution_reward.findUnique({
    where: { address },
  });

  if (row) {
    return {
      eligible: true,
      address,
      count: row.count,
      rewardAmount: row.count * REWARD_UNIT,
      isClaimed: row.is_claimed,
      claimedAt: row.claimed_at ? row.claimed_at.toISOString() : null,
    };
  }

  return {
    eligible: false,
    address,
    count: 0,
    rewardAmount: 0,
    isClaimed: false,
    claimedAt: null,
  };
}

/**
 * Error codes that `processClaim` can surface to its caller.
 *
 *  - `NOT_ELIGIBLE`    — the address is not present in `trn_distribution_reward`
 *  - `ALREADY_CLAIMED` — the address is present but `is_claimed` is already `true`
 *  - `DB_ERROR`        — unexpected database failure (reserved for callers that
 *                        want to re-throw low-level errors as a uniform type)
 */
export type ClaimErrorCode = 'NOT_ELIGIBLE' | 'ALREADY_CLAIMED' | 'DB_ERROR';

/**
 * Typed error thrown by `processClaim` so the API route handler can map the
 * `code` to the correct HTTP status:
 *
 *  - `NOT_ELIGIBLE`    → 403 "Address is not eligible for reward claim"
 *  - `ALREADY_CLAIMED` → 409 "Reward has already been claimed"
 *  - `DB_ERROR`        → 500 "Failed to process claim"
 *
 * `processClaim` never catches `ClaimError` internally — it lets the error
 * propagate out of `prisma.$transaction`, which rolls back every write done
 * inside the callback and guarantees the pre-state is preserved
 * (Requirement 4.13).
 */
export class ClaimError extends Error {
  public readonly code: ClaimErrorCode;

  constructor(code: ClaimErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ClaimError';
    this.code = code;
    // Maintain a correct prototype chain across transpilation targets.
    Object.setPrototypeOf(this, ClaimError.prototype);
  }
}

/**
 * Shape of a successful claim. Mirrors the JSON body returned by
 * `POST /api/claim-reward/claim` (minus the `success` envelope, which is
 * added by the route handler).
 */
export interface ClaimResult {
  address: string;
  count: number;
  rewardAmount: number;
  newBalance: number;
  claimedAt: Date;
}

/**
 * Atomically processes a reward claim for an already-lowercased wallet
 * address. All database writes happen inside a single `prisma.$transaction`,
 * so any thrown error — including `ClaimError` — rolls back every mutation
 * made inside the callback (Requirement 4.13).
 *
 * The flow matches design section "4. Claim Reward Service":
 *
 * 1. Atomically flip `is_claimed` from `false` to `true` via `updateMany`.
 *    The conditional `WHERE is_claimed = false` is the race-condition gate:
 *    only one concurrent caller observes `count === 1` (Requirements 5.1,
 *    5.2).
 * 2. If `count === 0`, disambiguate: a missing row means the address is
 *    not whitelisted (`NOT_ELIGIBLE`); an existing row means it was
 *    claimed previously or by another caller (`ALREADY_CLAIMED`).
 * 3. Re-read the locked row so we have the authoritative `count`, then
 *    compute `rewardAmount = count * REWARD_UNIT`.
 * 4. Upsert `mst_users` for the address, incrementing `points` by
 *    `rewardAmount` on the existing row or creating a new row with
 *    `points = rewardAmount` (Requirements 6.1, 6.5).
 * 5. Insert a `trn_point` audit row with `type = "REWARD_DISTRIBUTION"` and
 *    the description format required by Requirement 6.3.
 * 6. Backfill `trn_distribution_reward.claim_tx_id` with the new
 *    `trn_point.id` so the claim can be traced back to the audit row.
 *
 * @param lowerAddress The lowercased wallet address. Callers are responsible
 *                     for normalization — this function does not lowercase
 *                     its input.
 * @returns The `ClaimResult` payload expected by the API route handler.
 * @throws {ClaimError} with `code`:
 *                     `NOT_ELIGIBLE`, `ALREADY_CLAIMED`, or `DB_ERROR`.
 */
export async function processClaim(lowerAddress: string): Promise<ClaimResult> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();

    // 1. Atomically flip is_claimed from false → true. The conditional
    //    WHERE clause is what makes concurrent claims safe: the database
    //    reports `count: 1` to exactly one caller and `count: 0` to the rest.
    const flip = await tx.trn_distribution_reward.updateMany({
      where: { address: lowerAddress, is_claimed: false },
      data: { is_claimed: true, claimed_at: now },
    });

    if (flip.count === 0) {
      // Either the address is not whitelisted, or it was already claimed.
      // Disambiguate with a lookup so we can return the correct error code.
      const existing = await tx.trn_distribution_reward.findUnique({
        where: { address: lowerAddress },
      });
      if (!existing) {
        throw new ClaimError('NOT_ELIGIBLE');
      }
      throw new ClaimError('ALREADY_CLAIMED');
    }

    // 2. Reload the (now locked) entry to obtain its authoritative `count`.
    const entry = await tx.trn_distribution_reward.findUniqueOrThrow({
      where: { address: lowerAddress },
    });
    const rewardAmount = entry.count * REWARD_UNIT;

    // 3. Upsert the user and credit the reward to their $PUNK balance.
    const user = await tx.mst_users.upsert({
      where: { address: lowerAddress },
      update: { points: { increment: rewardAmount } },
      create: { address: lowerAddress, points: rewardAmount },
    });

    // 4. Create an audit row on `trn_point` so the leaderboard query picks
    //    this claim up. The description format is mandated by Requirement 6.3
    //    — note the `×` multiplication sign (U+00D7), not a lowercase "x".
    const txRow = await tx.trn_point.create({
      data: {
        userId: user.id,
        points: rewardAmount,
        type: 'REWARD_DISTRIBUTION',
        description: `Claimed reward distribution: ${entry.count} NFTs × ${REWARD_UNIT} = ${rewardAmount} $PUNK`,
      },
    });

    // 5. Backfill the audit trail on the distribution row.
    await tx.trn_distribution_reward.update({
      where: { address: lowerAddress },
      data: { claim_tx_id: txRow.id },
    });

    return {
      address: lowerAddress,
      count: entry.count,
      rewardAmount,
      newBalance: user.points,
      claimedAt: now,
    };
  });
}
