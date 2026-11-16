/**
 * Session Token Manager
 * Vercel Edge Runtime Compatible (no Node.js crypto)
 */

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-in-production-vercel-env';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours (was 1 hour)

interface SessionData {
  address: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Generate HMAC signature using Web Crypto API (Vercel compatible)
 */
async function generateHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Generate a session token for an address
 */
export async function generateSessionToken(address: string): Promise<string> {
  const data: SessionData = {
    address: address.toLowerCase(),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION,
  };
  
  const payload = btoa(JSON.stringify(data));
  const signature = await generateHmac(payload, SESSION_SECRET);
  
  return `${payload}.${signature}`;
}

/**
 * Validate and decode a session token
 */
export async function validateSessionToken(token: string): Promise<{ valid: boolean; address?: string; error?: string }> {
  try {
    const [payload, signature] = token.split('.');
    
    if (!payload || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    // Verify signature
    const expectedSignature = await generateHmac(payload, SESSION_SECRET);
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // Decode payload
    const data: SessionData = JSON.parse(atob(payload));
    
    // Check expiration
    if (Date.now() > data.expiresAt) {
      return { valid: false, error: 'Session expired' };
    }
    
    return { valid: true, address: data.address };
  } catch (error) {
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Extract address from token without full validation (for logging)
 */
export function getAddressFromToken(token: string): string | null {
  try {
    const [payload] = token.split('.');
    const data: SessionData = JSON.parse(atob(payload));
    return data.address;
  } catch {
    return null;
  }
}
