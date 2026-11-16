import { NextRequest } from 'next/server';
import Redis from 'ioredis';

/**
 * Redis-based rate limiter
 * Works on any platform (Vercel, local, other hosting)
 */

let redis: Redis | null = null;
let isConnected = false;

// Initialize Redis connection
function initRedis() {
  if (redis) return redis;

  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.warn('REDIS_URL not configured, rate limiting will not work');
      return null;
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      isConnected = true;
      console.log('Redis rate limiter connected');
    });

    redis.on('error', (err) => {
      console.error('Redis rate limiter error:', err);
      isConnected = false;
    });

    // Connect asynchronously
    redis.connect().catch((err) => {
      console.error('Failed to connect Redis rate limiter:', err);
    });

    return redis;
  } catch (error) {
    console.error('Error initializing Redis rate limiter:', error);
    return null;
  }
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Strict limit for admin endpoints
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  // Standard limit for authenticated endpoints
  AUTHENTICATED: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Relaxed limit for public endpoints
  PUBLIC: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Very strict for write operations
  WRITE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
};

/**
 * Get client IP from a request.
 * Pulls the first entry from the `x-forwarded-for` header and falls back to `"unknown"`.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0] : 'unknown';
}

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get wallet address first
  const walletAddress = request.headers.get('x-wallet-address');
  if (walletAddress) {
    return `wallet:${walletAddress}`;
  }

  // Fall back to IP address
  return `ip:${getClientIp(request)}`;
}

/**
 * Check rate limit for an EXPLICIT Redis key.
 *
 * Unlike `checkRateLimit`, the caller is responsible for composing the key
 * (e.g., `claim:wallet:0x...`). This enables per-wallet + per-IP composite
 * rate limiting where a single request needs to increment multiple counters.
 *
 * Returns `{ allowed, remaining, resetAt }` where `resetAt` is an absolute
 * epoch-ms timestamp. Fails open (allows the request) when Redis is
 * unavailable or any error occurs, matching the existing `checkRateLimit`
 * behavior.
 */
export async function checkRateLimitKey(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redisClient = initRedis();
  const now = Date.now();

  // If Redis is not available, allow the request (fail open)
  if (!redisClient || !isConnected) {
    console.warn('Rate limiting unavailable - Redis not connected');
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    const count = await redisClient.incr(key);

    // Set expiry on first request within the window
    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    const ttl = await redisClient.ttl(key);
    const resetAt = now + (ttl > 0 ? ttl * 1000 : config.windowMs);

    return {
      allowed: count <= config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }
}

/**
 * Check rate limit for a request using Redis
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.PUBLIC
): Promise<RateLimitResult> {
  const redisClient = initRedis();
  
  // If Redis is not available, allow the request
  if (!redisClient || !isConnected) {
    console.warn('Rate limiting unavailable - Redis not connected');
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }

  const clientId = getClientId(request);
  const now = Date.now();
  const key = `ratelimit:${clientId}:${request.nextUrl.pathname}`;
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    // Use Redis INCR with EXPIRE for atomic rate limiting
    const count = await redisClient.incr(key);
    
    // Set expiry on first request
    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    // Get TTL to calculate reset time
    const ttl = await redisClient.ttl(key);
    const resetTime = now + (ttl > 0 ? ttl * 1000 : config.windowMs);

    // Check if limit exceeded
    if (count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        error: `Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetTime,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }
}

/**
 * Rate limit middleware for admin endpoints
 */
export async function rateLimitAdmin(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, RATE_LIMITS.ADMIN);
}

/**
 * Rate limit middleware for authenticated endpoints
 */
export async function rateLimitAuthenticated(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, RATE_LIMITS.AUTHENTICATED);
}

/**
 * Rate limit middleware for public endpoints
 */
export async function rateLimitPublic(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, RATE_LIMITS.PUBLIC);
}

/**
 * Rate limit middleware for write operations
 */
export async function rateLimitWrite(request: NextRequest): Promise<RateLimitResult> {
  return checkRateLimit(request, RATE_LIMITS.WRITE);
}
