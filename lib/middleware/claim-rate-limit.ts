import { NextRequest } from 'next/server';
import { checkRateLimitKey, getClientIp } from './rate-limit-redis';

/**
 * Rate limit caps for the reward distribution claim endpoint.
 *
 * These are exported so tests can drive the limiter deterministically
 * instead of relying on magic numbers inside `checkClaimRateLimit`.
 */
export const CLAIM_WALLET_WINDOW_MS = 60_000;
export const CLAIM_WALLET_MAX = 5;
export const CLAIM_IP_WINDOW_MS = 60_000;
export const CLAIM_IP_MAX = 20;

/**
 * Enforce composite rate limiting for `POST /api/claim-reward/claim`.
 *
 * A single request increments two independent counters:
 *  - `claim:wallet:<addr>` — {@link CLAIM_WALLET_MAX} requests per
 *    {@link CLAIM_WALLET_WINDOW_MS}
 *  - `claim:ip:<ip>`       — {@link CLAIM_IP_MAX} requests per
 *    {@link CLAIM_IP_WINDOW_MS}
 *
 * Both counters are incremented in parallel. If either exceeds its cap the
 * request is rejected and the offending dimension is returned in `reason`
 * (wallet cap takes precedence when both are exceeded in the same call).
 *
 * The caller is expected to pass the already-lowercased wallet address so
 * the key namespace matches the rest of the codebase.
 */
export async function checkClaimRateLimit(
  request: NextRequest,
  walletAddress: string
): Promise<{ allowed: boolean; reason?: 'wallet' | 'ip' }> {
  const ip = getClientIp(request);

  const [walletRes, ipRes] = await Promise.all([
    checkRateLimitKey(`claim:wallet:${walletAddress}`, {
      windowMs: CLAIM_WALLET_WINDOW_MS,
      maxRequests: CLAIM_WALLET_MAX,
    }),
    checkRateLimitKey(`claim:ip:${ip}`, {
      windowMs: CLAIM_IP_WINDOW_MS,
      maxRequests: CLAIM_IP_MAX,
    }),
  ]);

  if (!walletRes.allowed) return { allowed: false, reason: 'wallet' };
  if (!ipRes.allowed) return { allowed: false, reason: 'ip' };
  return { allowed: true };
}
