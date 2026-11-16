import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const authenticate = useCallback(async () => {
    if (!address) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: 'No wallet connected',
      });
      return false;
    }

    // Prevent multiple simultaneous authentication attempts
    if (authState.isLoading) {
      return false;
    }

    setAuthState({
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });

    try {
      // Step 1: Get nonce/message from server
      const nonceResponse = await fetch(
        `/api/auth/nonce?address=${address}`
      );
      
      if (!nonceResponse.ok) {
        const errorText = await nonceResponse.text();
        console.error('Nonce request failed:', errorText);
        throw new Error(`Failed to get nonce: ${nonceResponse.status}`);
      }
      
      const nonceData = await nonceResponse.json();

      if (!nonceData.success) {
        console.error('Nonce response error:', nonceData);
        throw new Error(nonceData.error || 'Failed to get nonce');
      }

      console.log('Nonce received, requesting signature...');

      // Step 2: Sign the message with wallet
      const signature = await signMessageAsync({
        message: nonceData.message,
      });

      console.log('Signature received, verifying...');

      // Step 3: Verify signature on server
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          message: nonceData.message,
          signature,
        }),
      });

      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text();
        console.error('Verify request failed:', errorText);
        throw new Error(`Verification failed: ${verifyResponse.status}`);
      }

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        console.error('Verify response error:', verifyData);
        throw new Error(verifyData.error || verifyData.details || 'Failed to verify signature');
      }

      console.log('Authentication successful!');

      // Store authentication in localStorage
      localStorage.setItem('auth_address', address);
      localStorage.setItem('auth_timestamp', Date.now().toString());

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      console.error('Authentication error:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Authentication failed',
      });
      return false;
    }
  }, [address, signMessageAsync]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_address');
    localStorage.removeItem('auth_timestamp');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const checkAuth = useCallback(() => {
    if (!address) return false;

    const storedAddress = localStorage.getItem('auth_address');
    const storedTimestamp = localStorage.getItem('auth_timestamp');

    if (!storedAddress || !storedTimestamp) return false;

    // Check if address matches
    if (storedAddress.toLowerCase() !== address.toLowerCase()) {
      logout();
      return false;
    }

    // Check if auth is still valid (24 hours)
    const timestamp = Number.parseInt(storedTimestamp);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (now - timestamp > twentyFourHours) {
      logout();
      return false;
    }

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    return true;
  }, [address, logout]);

  return {
    ...authState,
    authenticate,
    logout,
    checkAuth,
  };
}
