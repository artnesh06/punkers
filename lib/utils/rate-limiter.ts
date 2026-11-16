/**
 * Rate Limiter - Prevents spam and abuse
 * Limits number of requests per time window
 * 
 * MEMORY-SAFE: Automatic cleanup and size limits
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
  timestamps: number[];
}

// In-memory storage for rate limits
const rateLimits = new Map<string, RateLimitRecord>();

// Cleanup interval
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_IDENTIFIERS = 50000; // Prevent memory leak

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  
  // Check memory limit BEFORE processing
  if (rateLimits.size >= MAX_IDENTIFIERS) {
    // Emergency cleanup
    cleanupExpiredLimits();
    
    // If still over limit and this is new identifier, reject
    if (rateLimits.size >= MAX_IDENTIFIERS && !rateLimits.has(identifier)) {
      console.error('Rate limit storage full. Possible DOS attack.');
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + windowMs,
      };
    }
  }
  
  const limit = rateLimits.get(identifier);
  
  // No previous record or window expired
  if (!limit || now > limit.resetAt) {
    const resetAt = now + windowMs;
    rateLimits.set(identifier, {
      count: 1,
      resetAt,
      timestamps: [now],
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  
  // Filter out old timestamps outside window
  const validTimestamps = limit.timestamps.filter(t => now - t < windowMs);
  
  // Check if limit exceeded
  if (validTimestamps.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: limit.resetAt,
    };
  }
  
  // Add new timestamp
  validTimestamps.push(now);
  rateLimits.set(identifier, {
    count: validTimestamps.length,
    resetAt: limit.resetAt,
    timestamps: validTimestamps,
  });
  
  return {
    allowed: true,
    remaining: maxRequests - validTimestamps.length,
    resetAt: limit.resetAt,
  };
}

/**
 * Clean up expired rate limit records
 */
export function cleanupExpiredLimits(): void {
  const now = Date.now();
  const toDelete: string[] = [];
  
  rateLimits.forEach((limit, identifier) => {
    if (now > limit.resetAt + 60000) { // 1 minute grace period
      toDelete.push(identifier);
    }
  });
  
  toDelete.forEach(identifier => rateLimits.delete(identifier));
  
  // Log cleanup for monitoring
  if (toDelete.length > 0) {
    console.log(`Cleaned up ${toDelete.length} expired rate limits. Active: ${rateLimits.size}`);
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredLimits, CLEANUP_INTERVAL);
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(identifier: string): RateLimitRecord | null {
  return rateLimits.get(identifier) || null;
}

/**
 * Reset rate limit for identifier (admin use)
 */
export function resetRateLimit(identifier: string): void {
  rateLimits.delete(identifier);
}

/**
 * Get total number of tracked identifiers (for monitoring)
 */
export function getTrackedIdentifierCount(): number {
  return rateLimits.size;
}

/**
 * Force cleanup (admin use)
 */
export function forceCleanup(): void {
  cleanupExpiredLimits();
}

/**
 * Clear all rate limits (admin use - DANGEROUS)
 */
export function clearAllRateLimits(): void {
  rateLimits.clear();
  console.warn('All rate limits cleared!');
}
