'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '@/lib/hooks/useAuth';
import styles from './WalletButton.module.css';

export function AuthButton() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isLoading, error, authenticate, checkAuth } = useAuth();

  // Check authentication status when component mounts or address changes
  useEffect(() => {
    if (isConnected && address) {
      checkAuth();
    }
  }, [isConnected, address, checkAuth]);

  // Don't show auth button if wallet not connected
  if (!isConnected || !address) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <div className={styles.authStatus}>
        <span className={styles.authIndicator}>✓</span>
        <span>Authenticated</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className={styles.authButton}
        onClick={authenticate}
        disabled={isLoading}
      >
        {isLoading ? 'Signing...' : 'Sign to Authenticate'}
      </button>
      {error && <div className={styles.authError}>{error}</div>}
    </div>
  );
}
