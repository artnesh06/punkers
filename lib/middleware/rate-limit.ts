/**
 * Redis-based rate limiter
 * Re-export from rate-limit-redis.ts
 */

export {
  checkRateLimit,
  rateLimitAdmin,
  rateLimitAuthenticated,
  rateLimitPublic,
  rateLimitWrite,
  RATE_LIMITS,
  type RateLimitConfig,
  type RateLimitResult,
} from './rate-limit-redis';
