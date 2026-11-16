'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/lib/hooks/useToast';
import styles from './WalletButton.module.css';

interface WalletButtonProps {
  readonly onConnect?: (address: string) => void;
  readonly onDisconnect?: () => void;
}

interface SocialData {
  discord: string | null;
  discordUsername: string | null;
  twitter: string | null;
  twitterUsername: string | null;
}

export default function WalletButton({
  onConnect,
  onDisconnect,
}: WalletButtonProps) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { isAuthenticated, isLoading: isAuthLoading, error: authError, authenticate, checkAuth } = useAuth();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [social, setSocial] = useState<SocialData>({ discord: null, discordUsername: null, twitter: null, twitterUsername: null });
  const [disconnectingSocial, setDisconnectingSocial] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle OAuth redirect — show toast for success/error
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(globalThis.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success) {
      const messages: Record<string, string> = {
        discord_connected: 'Discord connected successfully',
        twitter_connected: 'Twitter connected successfully',
      };
      showToast({ message: messages[success] || 'Connected successfully', type: 'success', duration: 4000 });
      globalThis.history.replaceState({}, '', globalThis.location.pathname);
      // Refetch social data after successful connect
      if (address) fetchSocial();
    } else if (error) {
      const messages: Record<string, string> = {
        discord_already_linked: 'This Discord is already linked to another wallet',
        twitter_already_linked: 'This Twitter is already linked to another wallet',
        discord_token_failed: 'Discord authentication failed',
        twitter_token_failed: 'Twitter authentication failed',
      };
      showToast({ message: messages[error] || 'Connection failed', type: 'error', duration: 5000 });
      globalThis.history.replaceState({}, '', globalThis.location.pathname);
    }
  }, [mounted]);

  useEffect(() => {
    if (isConnected && address) {
      const autoAuth = async () => {
        const isAuth = checkAuth();
        if (!isAuth && !isAuthLoading && !isAuthenticated) {
          const success = await authenticate();
          if (!success) {
            showToast({
              message: 'Authentication failed. Please try again.',
              type: 'error',
              duration: 5000,
            });
          }
        }
      };
      autoAuth();
      fetchSocial();
      if (onConnect) onConnect(address);
    }
  }, [isConnected, address]);

  // Refetch social data when popup opens
  useEffect(() => {
    if (isPopupOpen && address) {
      fetchSocial();
    }
  }, [isPopupOpen, address]);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsPopupOpen(false);
      }
    };
    if (isPopupOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isPopupOpen]);

  const fetchSocial = async () => {
    try {
      const res = await fetch(`/api/user/profile?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setSocial({
          discord: data.profile?.discord || null,
          discordUsername: data.profile?.discordUsername || null,
          twitter: data.profile?.twitter || null,
          twitterUsername: data.profile?.twitterUsername || null,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const shortenAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 5)}...${addr.slice(-3)}`;
  };

  const handleConnect = () => {
    if (openConnectModal) openConnectModal();
  };

  const handleDisconnect = () => {
    setIsPopupOpen(false);
    disconnect();
    if (onDisconnect) onDisconnect();
  };

  const connectDiscord = () => {
    if (!address) return;
    window.location.href = `/api/auth/discord?address=${address}`;
  };

  const connectTwitter = () => {
    if (!address) return;
    window.location.href = `/api/auth/twitter?address=${address}`;
  };

  const disconnectSocial = async (provider: 'discord' | 'twitter') => {
    if (!address) return;
    setDisconnectingSocial(provider);
    try {
      const res = await fetch('/api/auth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, provider }),
      });
      if (res.ok) await fetchSocial();
    } catch (e) {
      console.error(e);
    } finally {
      setDisconnectingSocial(null);
    }
  };

  const togglePopup = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPopupOpen(!isPopupOpen);
  };

  if (!mounted) {
    return <button className={styles.walletButton}>Connect Wallet</button>;
  }

  if (isConnected && address && !isAuthenticated && isAuthLoading) {
    return (
      <button className={styles.walletButton} disabled>
        Authenticating...
      </button>
    );
  }

  if (isConnected && address && !isAuthenticated && authError) {
    return (
      <button
        className={styles.walletButton}
        onClick={async () => {
          const success = await authenticate();
          if (!success) {
            showToast({
              message: 'Authentication failed. Please try again.',
              type: 'error',
              duration: 5000,
            });
          }
        }}
      >
        Retry Sign-In
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className={styles.walletWrapper} ref={popupRef}>
        <button
          className={`${styles.walletButton} ${styles.connected}`}
          onClick={togglePopup}
        >
          {shortenAddress(address)}
        </button>

        {isPopupOpen && (
          <div className={styles.walletPopup}>
            <div className={styles.popupHeader}>
              <span className={styles.popupAddress}>{shortenAddress(address)}</span>
            </div>

            <div className={styles.popupSection}>
              <div className={styles.popupLabel}>SOCIAL CONNECTIONS</div>

              {/* Discord */}
              <div className={styles.popupSocialRow}>
                <span className={styles.popupSocialIcon}>
                  <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="#5865F2"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
                </span>
                {social.discord ? (
                  <>
                    <span className={styles.popupSocialName}>{social.discordUsername}</span>
                    <button
                      className={styles.popupSocialAction}
                      onClick={() => disconnectSocial('discord')}
                      disabled={disconnectingSocial === 'discord'}
                    >
                      {disconnectingSocial === 'discord' ? '...' : '✕'}
                    </button>
                  </>
                ) : (
                  <button className={styles.popupConnectBtn} onClick={connectDiscord}>
                    Connect Discord
                  </button>
                )}
              </div>

              {/* Twitter */}
              <div className={styles.popupSocialRow}>
                <span className={styles.popupSocialIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </span>
                {social.twitter ? (
                  <>
                    <span className={styles.popupSocialName}>@{social.twitterUsername}</span>
                    <button
                      className={styles.popupSocialAction}
                      onClick={() => disconnectSocial('twitter')}
                      disabled={disconnectingSocial === 'twitter'}
                    >
                      {disconnectingSocial === 'twitter' ? '...' : '✕'}
                    </button>
                  </>
                ) : (
                  <button className={styles.popupConnectBtn} onClick={connectTwitter}>
                    Connect Twitter
                  </button>
                )}
              </div>
            </div>

            <button className={styles.popupDisconnect} onClick={handleDisconnect}>
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button className={styles.walletButton} onClick={handleConnect}>
      Connect Wallet
    </button>
  );
}
