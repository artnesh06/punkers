import { NextRequest } from 'next/server';

/**
 * Simple API key authentication middleware
 * For production, consider using NextAuth.js or JWT tokens
 */

export interface AuthResult {
  authenticated: boolean;
  error?: string;
  role?: 'admin' | 'user';
}

/**
 * Verify API key from request headers
 */
export function verifyApiKey(request: NextRequest): AuthResult {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return {
      authenticated: false,
      error: 'API key is required',
    };
  }

  // Get admin API key from environment
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminApiKey) {
    console.error('ADMIN_API_KEY not configured in environment');
    return {
      authenticated: false,
      error: 'Server configuration error',
    };
  }

  // Verify API key
  if (apiKey === adminApiKey) {
    return {
      authenticated: true,
      role: 'admin',
    };
  }

  return {
    authenticated: false,
    error: 'Invalid API key',
  };
}

/**
 * Verify wallet signature for user authentication
 */
export async function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): Promise<AuthResult> {
  try {
    // Validate inputs
    if (!address || !signature || !message) {
      return {
        authenticated: false,
        error: 'Missing authentication parameters',
      };
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return {
        authenticated: false,
        error: 'Invalid address format',
      };
    }

    // Validate signature format
    if (!/^0x[a-fA-F0-9]{130}$/.test(signature)) {
      return {
        authenticated: false,
        error: 'Invalid signature format',
      };
    }

    // Import viem for signature verification
    const { verifyMessage } = await import('viem');

    // Verify the signature
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return {
        authenticated: false,
        error: 'Invalid signature',
      };
    }

    // Optional: Check message timestamp to prevent replay attacks
    // Expected message format: "Sign in to Punkers Survival\nTimestamp: 1234567890"
    if (message.includes('Timestamp:')) {
      const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1], 10);
        const now = Math.floor(Date.now() / 1000);
        const maxAge = 5 * 60; // 5 minutes

        if (now - timestamp > maxAge) {
          return {
            authenticated: false,
            error: 'Signature expired',
          };
        }
      }
    }

    return {
      authenticated: true,
      role: 'user',
    };
  } catch (error) {
    console.error('Signature verification error:', error);
    return {
      authenticated: false,
      error: 'Signature verification failed',
    };
  }
}

/**
 * Check if request is from admin
 */
export function requireAdmin(request: NextRequest): AuthResult {
  return verifyApiKey(request);
}

/**
 * Check if request is authenticated (admin or user)
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  // First try API key (admin)
  const apiKeyResult = verifyApiKey(request);
  if (apiKeyResult.authenticated) {
    return apiKeyResult;
  }

  // Then try wallet signature (user)
  const address = request.headers.get('x-wallet-address');
  const signature = request.headers.get('x-wallet-signature');
  const message = request.headers.get('x-wallet-message');

  if (address && signature && message) {
    return await verifyWalletSignature(address, signature, message);
  }

  return {
    authenticated: false,
    error: 'Authentication required',
  };
}
