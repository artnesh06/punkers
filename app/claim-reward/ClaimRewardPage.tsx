'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { buildClaimMessage } from './buildClaimMessage';
import type { ClaimResponse, ClaimStatusResponse } from '@/types/claim-reward';
import styles from './ClaimRewardPage.module.css';

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

function shortenAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatClaimedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function formatRewardAmount(n: number): string {
  return `${n.toLocaleString()} $PUNK`;
}

function isUserRejection(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; message?: string };
  if (e.name === 'UserRejectedRequestError') return true;
  if (typeof e.message === 'string' && e.message.toLowerCase().includes('reject')) {
    return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────

export default function ClaimRewardPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ClaimStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStatus = useCallback(async (addr: string) => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/claim-reward/status?address=${addr}`);
      const data = (await res.json()) as ClaimStatusResponse & { error?: string };
      if (!res.ok || !data.success) {
        setStatusError(data.error ?? 'Failed to fetch claim status');
        setStatus(null);
        return;
      }
      setStatus(data);
    } catch {
      setStatusError('Network error, please try again');
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      setSuccessMessage(null);
      setClaimError(null);
      fetchStatus(address);
    } else {
      setStatus(null);
    }
  }, [isConnected, address, fetchStatus]);

  const handleClaim = useCallback(async () => {
    if (!address || !status?.eligible || status.isClaimed) return;

    setClaimError(null);
    setSuccessMessage(null);
    setClaiming(true);

    const unix = Math.floor(Date.now() / 1000);
    const msg = buildClaimMessage(address, unix);

    let signature: string;
    try {
      signature = await signMessageAsync({ message: msg });
    } catch (err) {
      if (isUserRejection(err)) {
        setClaimError('Signature was rejected');
      } else {
        setClaimError('Failed to sign message');
      }
      setClaiming(false);
      return;
    }

    try {
      const res = await fetch('/api/claim-reward/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message: msg, signature }),
      });
      const data = (await res.json()) as ClaimResponse;

      if (!res.ok || !data.success) {
        setClaimError(data.error ?? 'Failed to process claim');
        setClaiming(false);
        return;
      }

      const rewardAmount = data.rewardAmount ?? status.rewardAmount;
      setSuccessMessage(
        `Successfully claimed ${formatRewardAmount(rewardAmount)}!`
      );
      setStatus({
        ...status,
        isClaimed: true,
        claimedAt: data.claimedAt ?? new Date().toISOString(),
        rewardAmount,
      });
    } catch {
      setClaimError('Network error, please try again');
    } finally {
      setClaiming(false);
    }
  }, [address, status, signMessageAsync]);

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className={styles.container}>
        <div className={styles.card} />
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Claim Reward Distribution</h1>
          <p className={styles.subtitle}>
            Connect your wallet to check eligibility and claim your $PUNK reward.
          </p>
          <button
            className={styles.button}
            onClick={() => openConnectModal?.()}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (statusLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Claim Reward Distribution</h1>
          <p className={styles.subtitle}>Checking eligibility…</p>
        </div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Claim Reward Distribution</h1>
          <div className={styles.banner}>{statusError}</div>
          <button
            className={styles.button}
            onClick={() => address && fetchStatus(address)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  if (!status.eligible) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Claim Reward Distribution</h1>
          <div className={styles.banner}>
            This wallet is not eligible for reward distribution
          </div>
          <p className={styles.meta}>{shortenAddress(address)}</p>
        </div>
      </div>
    );
  }

  if (status.isClaimed) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Claim Reward Distribution</h1>
          {successMessage && (
            <div className={styles.success}>{successMessage}</div>
          )}
          <div className={styles.row}>
            <span className={styles.label}>Wallet</span>
            <span className={styles.value}>{shortenAddress(address)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Reward</span>
            <span className={styles.value}>
              {formatRewardAmount(status.rewardAmount)}
            </span>
          </div>
          {status.claimedAt && (
            <div className={styles.row}>
              <span className={styles.label}>Claimed at</span>
              <span className={styles.value}>
                {formatClaimedAt(status.claimedAt)}
              </span>
            </div>
          )}
          <button className={styles.button} disabled>
            Already Claimed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Claim Reward Distribution</h1>
        <p className={styles.subtitle}>
          You are eligible to claim your $PUNK reward.
        </p>
        <div className={styles.row}>
          <span className={styles.label}>Wallet</span>
          <span className={styles.value}>{shortenAddress(address)}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>NFTs</span>
          <span className={styles.value}>{status.count}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Reward</span>
          <span className={styles.value}>
            {formatRewardAmount(status.rewardAmount)}
          </span>
        </div>
        {claimError && <div className={styles.error}>{claimError}</div>}
        <button
          className={styles.button}
          onClick={handleClaim}
          disabled={claiming}
        >
          {claiming ? 'Claiming…' : 'Claim Reward'}
        </button>
      </div>
    </div>
  );
}
