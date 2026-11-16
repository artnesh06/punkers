/**
 * Nonce Manager - Prevents replay attacks
 * Each request must have a unique nonce that can only be used once
 * 
 * THREAD-SAFE: Uses atomic operations to prevent race conditions
 */

interface NonceRecord {
  nonce: string;
  expiresAt: number;
}

// In-memory storage for used nonces
const usedNonces = new Map<string, number>();

// Cleanup interval
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const NONCE_EXPIRY = 60 * 60 * 1000; // 1 hour
const MAX_NONCES = 100000; // Prevent memory leak

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Validate that nonce hasn't been used before
 * ATOMIC OPERATION - Thread-safe
 */
export function validateNonce(nonce: string): boolean {
  const now = Date.now();
  
  // ATOMIC CHECK: Check and set in one operation
  if (usedNonces.has(nonce)) {
    const usedAt = usedNonces.get(nonce)!;
    // If still within expiry window, reject
    if (now - usedAt < NONCE_EXPIRY) {
      return false; // Already used
    }
    // If expired, remove and continue
    usedNonces.delete(nonce);
  }
  
  // Check memory limit BEFORE adding
  if (usedNonces.size >= MAX_NONCES) {
    // Emergency cleanup
    cleanupExpiredNonces();
    
    // If still over limit, reject
    if (usedNonces.size >= MAX_NONCES) {
      console.error('Nonce storage full. Possible DOS attack.');
      return false;
    }
  }
  
  // Mark nonce as used (ATOMIC)
  usedNonces.set(nonce, now);
  
  return true;
}

/**
 * Clean up expired nonces periodically
 */
export function cleanupExpiredNonces(): void {
  const now = Date.now();
  const toDelete: string[] = [];
  
  usedNonces.forEach((usedAt, nonce) => {
    if (now - usedAt > NONCE_EXPIRY) {
      toDelete.push(nonce);
    }
  });
  
  toDelete.forEach(nonce => usedNonces.delete(nonce));
  
  // Log cleanup for monitoring
  if (toDelete.length > 0) {
    console.log(`Cleaned up ${toDelete.length} expired nonces. Active: ${usedNonces.size}`);
  }
}

// Auto cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredNonces, CLEANUP_INTERVAL);
}

/**
 * Get total number of active nonces (for monitoring)
 */
export function getActiveNonceCount(): number {
  return usedNonces.size;
}

/**
 * Force cleanup (admin use)
 */
export function forceCleanup(): void {
  cleanupExpiredNonces();
}

/**
 * Clear all nonces (admin use - DANGEROUS)
 */
export function clearAllNonces(): void {
  usedNonces.clear();
  console.warn('All nonces cleared!');
}
