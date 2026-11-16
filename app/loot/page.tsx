'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import styles from '@/styles/game.module.css';

interface LootItem {
  emoji: string;
  name: string;
  punk: number;
  rarity: string;
  rc: string;
  weight: number;
}

interface LootChest {
  id: string;
  icon: string;
  label: string;
  color: string;
  rgb: string;
  cost: number;
  lootTable: LootItem[];
}

interface LootHistory {
  id: string;
  chestType: string;
  cost: number;
  lootEmoji: string;
  lootName: string;
  lootRarity: string;
  payout: number;
  createdAt: string;
}

interface LootStats {
  balance: number;
  stats: {
    totalOpened: number;
    totalEarned: number;
    totalSpent: number;
    netProfit: number;
    bestWin: number;
  };
  recentHistory: LootHistory[];
  chests: LootChest[];
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: '#888888',
  UNCOMMON: '#aaaaaa',
  RARE: '#ff6600',
  EPIC: '#b44dff',
  LEGENDARY: '#ffcc00',
};

export default function LootPage() {
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<LootStats | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<{ loot: LootItem; chestLabel: string; chestCost: number } | null>(null);
  const [rolling, setRolling] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/loot/stats?address=${address.toLowerCase()}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error('Failed to load loot stats:', e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) loadStats();
  }, [isConnected, address, loadStats]);

  const selectChest = (id: string) => {
    if (opening) return;
    if (!data) return;
    const chest = data.chests.find((c) => c.id === id);
    if (!chest || data.balance < chest.cost) return;
    setSelected(id);
    setResult(null);
  };

  const openChest = async () => {
    if (opening || !selected || !address || !data) return;
    const chest = data.chests.find((c) => c.id === selected);
    if (!chest || data.balance < chest.cost) return;

    setOpening(true);
    setRolling(true);
    setResult(null);

    try {
      const res = await fetch('/api/loot/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.toLowerCase(), chestId: selected }),
      });
      const d = await res.json();

      if (!res.ok) throw new Error(d.error || 'Failed to open chest');

      // Show rolling animation for 1.3s then reveal
      setTimeout(() => {
        setRolling(false);
        setResult(d.result);
        setOpening(false);
        loadStats();
      }, 1300);
    } catch (e) {
      setRolling(false);
      setOpening(false);
      alert(e instanceof Error ? e.message : 'Failed to open chest');
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.page} style={{ display: 'block' }}>
        <div className={styles.lock}>
          <div style={{ fontSize: '64px' }}>🔒</div>
          <h2 style={{ fontSize: '24px', color: 'var(--red)' }}>WALLET NOT CONNECTED</h2>
          <p style={{ fontSize: '16px', color: 'var(--dim)' }}>Connect your wallet to open loot chests</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className={styles.page} style={{ display: 'block', textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: 'var(--dim)' }}>Loading loot chests...</p>
      </div>
    );
  }

  const selectedChest = selected ? data.chests.find((c) => c.id === selected) : null;

  return (
    <div className={styles.page} style={{ display: 'block' }}>
      {/* Header */}
      <div className={styles.panel}>
        <h1 className={styles.panelTitle}>🎁 LOOT CHEST</h1>
        <p style={{ fontSize: '16px', color: 'var(--dim)', marginBottom: '20px' }}>
          Open chests to win $PUNK. Higher tier chests have better loot tables.
        </p>

        {/* Stats Bar */}
        <div className={styles.sg}>
          <div className={styles.sc}>
            <div className={styles.lb}>BALANCE</div>
            <div className={styles.vl} style={{ color: 'var(--gold)' }}>{data.balance} $PUNK</div>
          </div>
          <div className={styles.sc}>
            <div className={styles.lb}>TOTAL EARNED</div>
            <div className={styles.vl} style={{ color: 'var(--green)' }}>{data.stats.totalEarned}</div>
          </div>
          <div className={styles.sc}>
            <div className={styles.lb}>CHESTS OPENED</div>
            <div className={styles.vl}>{data.stats.totalOpened}</div>
          </div>
          <div className={styles.sc}>
            <div className={styles.lb}>BEST WIN</div>
            <div className={styles.vl} style={{ color: 'var(--gold)' }}>
              {data.stats.bestWin > 0 ? `+${data.stats.bestWin}` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Chest Selection */}
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>SELECT A CHEST</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {data.chests.map((chest) => {
            const locked = data.balance < chest.cost;
            const isSelected = selected === chest.id;
            const total = chest.lootTable.reduce((s, l) => s + l.weight, 0);

            return (
              <button
                key={chest.id}
                onClick={() => selectChest(chest.id)}
                disabled={locked}
                style={{
                  background: isSelected ? `rgba(${chest.rgb}, 0.1)` : 'var(--bg-card)',
                  border: `1px solid ${isSelected ? chest.color : 'var(--border-color)'}`,
                  padding: '20px',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.4 : 1,
                  textAlign: 'center',
                  transition: 'all .2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: chest.color, boxShadow: `0 0 8px ${chest.color}`,
                  }} />
                )}
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{chest.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '10px', color: chest.color, letterSpacing: '2px', marginBottom: '8px' }}>
                  {chest.label} CHEST
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--dim)', marginBottom: '12px' }}>
                  {chest.cost} $PUNK to open
                </div>
                {/* Odds */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {chest.lootTable.map((l) => (
                    <div key={l.rarity} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      <span style={{ color: l.rc }}>{l.rarity}</span>
                      <span style={{ color: l.rc }}>{((l.weight / total) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                {isSelected && (
                  <div style={{
                    marginTop: '12px', fontFamily: 'var(--font-display)', fontSize: '8px',
                    background: chest.color, color: '#000', padding: '4px 10px', letterSpacing: '1px',
                  }}>
                    ▶ SELECTED ◀
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Result Area */}
        <div style={{
          minHeight: '180px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          padding: '24px', marginBottom: '16px', position: 'relative', overflow: 'hidden',
        }}>
          {rolling ? (
            <>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '9px', color: 'var(--accent-yellow)',
                letterSpacing: '3px', marginBottom: '16px', animation: 'pulse 0.5s infinite',
              }}>
                ROLLING...
              </div>
              <div style={{ fontSize: '48px', animation: 'slotIdle 0.3s infinite' }}>🎲</div>
              {selectedChest && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--dim)', marginTop: '12px', letterSpacing: '2px' }}>
                  {selectedChest.label} CHEST
                </div>
              )}
            </>
          ) : result ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '12px' }}>{result.loot.emoji}</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '9px',
                background: `${result.loot.rc}22`, color: result.loot.rc,
                border: `1px solid ${result.loot.rc}55`, padding: '4px 12px',
                letterSpacing: '2px', display: 'inline-block', marginBottom: '8px',
              }}>
                {result.loot.rarity}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '22px', color: result.loot.rc, marginBottom: '8px' }}>
                {result.loot.name}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--green)' }}>
                +{result.loot.punk} <span style={{ fontSize: '14px', color: 'var(--dim)' }}>$PUNK</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--dim)', marginTop: '8px' }}>
                {result.chestLabel} CHEST · spent {result.chestCost} $PUNK
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--dim)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.4 }}>🎁</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', letterSpacing: '1px' }}>
                {selected ? 'Ready to open' : 'Select a chest to begin'}
              </div>
            </div>
          )}
        </div>

        {/* Open Button */}
        <button
          onClick={openChest}
          disabled={!selected || opening || (selectedChest ? data.balance < selectedChest.cost : true)}
          style={{
            width: '100%', padding: '14px', fontFamily: 'var(--font-display)', fontSize: '12px',
            letterSpacing: '2px', textTransform: 'uppercase',
            background: selected && !opening ? 'var(--accent-red)' : 'var(--bg-card)',
            color: selected && !opening ? '#fff' : 'var(--dim)',
            border: `1px solid ${selected ? 'var(--accent-red)' : 'var(--border-color)'}`,
            cursor: selected && !opening ? 'pointer' : 'not-allowed',
            transition: 'all .2s',
          }}
        >
          {opening ? 'OPENING...' : selectedChest ? `OPEN ${selectedChest.label} CHEST — ${selectedChest.cost} $PUNK` : 'SELECT A CHEST FIRST'}
        </button>
      </div>

      {/* History */}
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>📜 LOOT HISTORY</h2>
        {data.recentHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--dim)', fontSize: '16px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
            <p>No pulls yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {data.recentHistory.map((h) => {
              const rc = RARITY_COLORS[h.lootRarity] || '#888';
              return (
                <div key={h.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
                  fontFamily: 'var(--font-mono)', fontSize: '13px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <span style={{ fontSize: '18px' }}>{h.lootEmoji}</span>
                    <div>
                      <div style={{ color: 'var(--text-primary)' }}>{h.lootName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--dim)' }}>
                        {h.chestType.toUpperCase()} chest · cost {h.cost} $PUNK
                      </div>
                    </div>
                    <span style={{
                      fontSize: '9px', fontFamily: 'var(--font-display)',
                      background: `${rc}22`, color: rc, border: `1px solid ${rc}44`,
                      padding: '2px 6px', letterSpacing: '1px',
                    }}>
                      {h.lootRarity}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--green)', fontWeight: 'bold' }}>+{h.payout}</div>
                    <div style={{ fontSize: '10px', color: 'var(--dim)' }}>$PUNK</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
