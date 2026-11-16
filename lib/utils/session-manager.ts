/**
 * Session Manager for Certificate System
 * Stores signed session in memory to avoid repeated signature requests
 */

interface Session {
  address: string;
  signature: string;
  timestamp: number;
  expiresAt: number;
}

// In-memory session storage (per browser session)
const sessions = new Map<string, Session>();

const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Store session after user signs once
 */
export function storeSession(address: string, signature: string, timestamp: number): void {
  const expiresAt = Date.now() + SESSION_DURATION;
  sessions.set(address.toLowerCase(), {
    address: address.toLowerCase(),
    signature,
    timestamp,
    expiresAt,
  });
}

/**
 * Get active session for address
 */
export function getSession(address: string): Session | null {
  const session = sessions.get(address.toLowerCase());
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > session.expiresAt) {
    sessions.delete(address.toLowerCase());
    return null;
  }
  
  return session;
}

/**
 * Clear session (logout)
 */
export function clearSession(address: string): void {
  sessions.delete(address.toLowerCase());
}

/**
 * Check if user has active session
 */
export function hasActiveSession(address: string): boolean {
  const session = getSession(address);
  return session !== null;
}
