import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { checkClaimRateLimit } from '@/lib/middleware/claim-rate-limit';
import { getClientIp } from '@/lib/middleware/rate-limit-redis';
import {
  processClaim,
  parseClaimMessage,
  ClaimError,
  ClaimMessageError,
  CLAIM_SIGNATURE_TTL_MS,
} from '@/lib/services/claim-reward-service';
import { logInfo, logError } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/claim-reward/claim
 *
 * Processes a reward-distribution claim for a whitelisted wallet. The flow
 * mirrors design section "6. API Route: POST /api/claim-reward/claim"
 * exactly:
 *
 *   1. Parse JSON body and require `address`, `message`, `signature`
 *      (Requirement 4.2).
 *   2. Validate the `address` format (Requirement 4.3).
 *   3. Enforce composite per-wallet + per-IP rate limiting
 *      (Requirements 9.1, 9.2).
 *   4. Verify the SIWE signature via `viem.verifyMessage`; the function
 *      implicitly checks that the recovered signer matches the supplied
 *      address, so no separate signer-match step is needed
 *      (Requirements 4.1, 4.4, 8.1, 8.2).
 *   5. Parse the claim message body (enforces max length 512 and the
 *      required substrings) via `parseClaimMessage`
 *      (Requirements 4.5, 9.3).
 *   6. Reject signatures older/newer than `CLAIM_SIGNATURE_TTL_MS`
 *      (Requirement 4.6).
 *   7. Execute the atomic claim via `processClaim`, mapping `ClaimError`
 *      codes to the correct HTTP responses
 *      (Requirements 4.7–4.13, 5.1, 5.3).
 *
 * Every code path emits exactly one structured log entry via `logInfo`
 * (for 4xx outcomes) or `logError` (for 5xx outcomes) to satisfy
 * Requirement 9.4.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // 1. Read and validate the JSON body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logInfo('claim-reward attempt', {
      address: null,
      ip,
      outcome: 'rejected',
      reason: 'missing_parameters',
    });
    return NextResponse.json(
      { success: false, error: 'Missing required parameters' },
      { status: 400 },
    );
  }

  const { address, message, signature } = (body ?? {}) as {
    address?: unknown;
    message?: unknown;
    signature?: unknown;
  };

  if (!address || !message || !signature) {
    logInfo('claim-reward attempt', {
      address:
        typeof address === 'string' ? address.toLowerCase() : null,
      ip,
      outcome: 'rejected',
      reason: 'missing_parameters',
    });
    return NextResponse.json(
      { success: false, error: 'Missing required parameters' },
      { status: 400 },
    );
  }

  // 2. Address format check.
  if (
    typeof address !== 'string' ||
    !/^0x[a-fA-F0-9]{40}$/.test(address)
  ) {
    logInfo('claim-reward attempt', {
      address: typeof address === 'string' ? address.toLowerCase() : null,
      ip,
      outcome: 'rejected',
      reason: 'invalid_address_format',
    });
    return NextResponse.json(
      { success: false, error: 'Invalid address format' },
      { status: 400 },
    );
  }

  const lowerAddress = address.toLowerCase();

  // 3. Composite rate limit (per-wallet + per-IP).
  const rl = await checkClaimRateLimit(request, lowerAddress);
  if (!rl.allowed) {
    logInfo('claim-reward attempt', {
      address: lowerAddress,
      ip,
      outcome: 'rejected',
      reason: `rate_limit:${rl.reason}`,
    });
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded' },
      { status: 429 },
    );
  }

  // 4. SIWE signature verification. `verifyMessage` will return `false` when
  //    the signature was produced by a different key than `address`, so this
  //    single call satisfies both Requirement 4.4 and 8.2.
  let isValid = false;
  try {
    isValid = await verifyMessage({
      address: address as `0x${string}`,
      message: message as string,
      signature: signature as `0x${string}`,
    });
  } catch {
    logInfo('claim-reward attempt', {
      address: lowerAddress,
      ip,
      outcome: 'rejected',
      reason: 'invalid_signature',
    });
    return NextResponse.json(
      { success: false, error: 'Invalid signature' },
      { status: 401 },
    );
  }

  if (!isValid) {
    logInfo('claim-reward attempt', {
      address: lowerAddress,
      ip,
      outcome: 'rejected',
      reason: 'invalid_signature',
    });
    return NextResponse.json(
      { success: false, error: 'Invalid signature' },
      { status: 401 },
    );
  }

  // 5. Parse claim message. `parseClaimMessage` enforces the max-length
  //    guard (Requirement 9.3), the required prefix, the address substring,
  //    and the `Timestamp:` line (Requirement 4.5). Non-string messages are
  //    treated as malformed.
  let parsed: { timestampMs: number };
  try {
    if (typeof message !== 'string') {
      throw new ClaimMessageError('TOO_LONG', 'Message must be a string');
    }
    parsed = parseClaimMessage(message, lowerAddress);
  } catch (err) {
    if (err instanceof ClaimMessageError) {
      logInfo('claim-reward attempt', {
        address: lowerAddress,
        ip,
        outcome: 'rejected',
        reason: 'invalid_claim_message',
      });
      return NextResponse.json(
        { success: false, error: 'Invalid claim message' },
        { status: 400 },
      );
    }
    logError(
      'claim-reward attempt',
      err instanceof Error ? err : new Error(String(err)),
      { address: lowerAddress, ip, outcome: 'error', reason: 'parse_error' },
    );
    return NextResponse.json(
      { success: false, error: 'Failed to process claim' },
      { status: 500 },
    );
  }

  // 6. Timestamp freshness (Requirement 4.6).
  const now = Date.now();
  if (Math.abs(now - parsed.timestampMs) > CLAIM_SIGNATURE_TTL_MS) {
    logInfo('claim-reward attempt', {
      address: lowerAddress,
      ip,
      outcome: 'rejected',
      reason: 'signature_expired',
    });
    return NextResponse.json(
      { success: false, error: 'Signature expired' },
      { status: 401 },
    );
  }

  // 7. Atomic claim via the service layer.
  try {
    const result = await processClaim(lowerAddress);

    logInfo('claim-reward attempt', {
      address: lowerAddress,
      ip,
      outcome: 'success',
      rewardAmount: result.rewardAmount,
    });

    return NextResponse.json(
      {
        success: true,
        address: result.address,
        count: result.count,
        rewardAmount: result.rewardAmount,
        newBalance: result.newBalance,
        claimedAt: result.claimedAt.toISOString(),
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ClaimError) {
      if (err.code === 'NOT_ELIGIBLE') {
        logInfo('claim-reward attempt', {
          address: lowerAddress,
          ip,
          outcome: 'rejected',
          reason: 'not_eligible',
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Address is not eligible for reward claim',
          },
          { status: 403 },
        );
      }
      if (err.code === 'ALREADY_CLAIMED') {
        logInfo('claim-reward attempt', {
          address: lowerAddress,
          ip,
          outcome: 'rejected',
          reason: 'already_claimed',
        });
        return NextResponse.json(
          { success: false, error: 'Reward has already been claimed' },
          { status: 409 },
        );
      }
    }

    logError(
      'claim-reward attempt',
      err instanceof Error ? err : new Error(String(err)),
      { address: lowerAddress, ip, outcome: 'error', reason: 'process_error' },
    );
    return NextResponse.json(
      { success: false, error: 'Failed to process claim' },
      { status: 500 },
    );
  }
}
