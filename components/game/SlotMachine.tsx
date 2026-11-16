'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

const SLOT_SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎', '7️⃣', '🃏'];
const BET_AMOUNTS = [10, 25, 50];

interface SlotStats {
  balance: number;
  stats: {
    totalSpins: number;
    totalWins: number;
    biggestWin: number;
    totalWagered: number;
    totalWon: number;
    netProfit: number;
    winRate: string;
  };
  recentSpins: Array<{
    id: string;
    betAmount: number;
    symbols: string[];
    payout: number;
    resultType: string;
    createdAt: string;
  }>;
}

interface SpinResult {
  symbols: string[];
  payout: number;
  resultType: 'lose' | 'win' | 'jackpot' | 'mega';
  resultText: string;
  matchCount: number;
  matchSymbol?: string;
}

export default function SlotMachine() {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<SlotStats | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState<string[]>(['🎰', '🎰', '🎰', '🎰']);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [resultMsg, setResultMsg] = useState('— SELECT BET & SPIN —');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isConnected && address) loadStats();
  }, [isConnected, address]);

  const loadStats = async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/slot/stats?address=${address.toLowerCase()}`);
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const spin = async () => {
    if (spinning || !stats || stats.balance < betAmount) return;
    setSpinning(true);
    setResult(null);
    setResultMsg('SPINNING...');

    intervalRef.current = setInterval(() => {
      setReels(Array.from({ length: 4 }, () =>
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ));
    }, 100);

    try {
      const res = await fetch('/api/slot/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address?.toLowerCase(), betAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Spin failed');

      setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setReels(data.result.symbols);
        setResult(data.result);
        setResultMsg(data.result.resultText);
        setStats((prev) => prev ? { ...prev, balance: data.balance } : null);
        setSpinning(false);
        setTimeout(loadStats, 500);
      }, 2000);
    } catch (err) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSpinning(false);
      setResultMsg('ERROR — TRY AGAIN');
      alert(err instanceof Error ? err.message : 'Spin failed');
    }
  };

  const getResultClass = () => {
    if (!result) return '';
    if (result.resultType === 'mega' || result.resultType === 'jackpot') return 'jackpot';
    if (result.resultType === 'win') return 'win';
    return 'lose';
  };

  const getReelClass = (symbol: string, i: number) => {
    if (!result || spinning) return '';
    if (result.matchCount >= 2 && result.matchSymbol === symbol) return 'winner';
    if (result.matchCount >= 2) return 'loser';
    return '';
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Loading...</div>;
  if (!stats) return <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)', color: 'var(--accent-red)' }}>Failed to load slot machine</div>;

  const canSpin = !spinning && stats.balance >= betAmount;

  return (
    <>
      {/* 4 stat boxes */}
      <div className="loot-stats-row" style={{ marginBottom: '28px' }}>
        <div className="loot-stat">
          <div className="ls-label">Balance</div>
          <div className="ls-val yellow">{stats.balance}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>$PUNK</div>
        </div>
        <div className="loot-stat">
          <div className="ls-label">Total Spins</div>
          <div className="ls-val">{stats.stats.totalSpins}</div>
        </div>
        <div className="loot-stat">
          <div className="ls-label">Wins</div>
          <div className="ls-val green">{stats.stats.totalWins}</div>
        </div>
        <div className="loot-stat">
          <div className="ls-label">Biggest Win</div>
          <div className="ls-val yellow">{stats.stats.biggestWin > 0 ? `+${stats.stats.biggestWin}` : '—'}</div>
        </div>
      </div>

      {/* Slot machine */}
      <div className="slot-machine">
        <div className="slot-reels">
          {reels.map((symbol, i) => (
            <div key={i} className={`slot-reel-box ${getReelClass(symbol, i)}`}>
              <div className={`slot-reel-strip${spinning ? ' spinning' : ''}`}>
                <div className="strip-item">{symbol}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={`slot-result-msg ${getResultClass()}`}>{resultMsg}</div>

        <div className="slot-bet-row">
          {BET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              className={`slot-bet-btn${betAmount === amount ? ' active' : ''}`}
              onClick={() => setBetAmount(amount)}
              disabled={spinning}
            >
              {amount} $PUNK
            </button>
          ))}
        </div>

        <button className="slot-spin-btn" onClick={spin} disabled={!canSpin}>
          {spinning ? 'SPINNING...' : stats.balance < betAmount ? 'NOT ENOUGH $PUNK' : `SPIN — ${betAmount} $PUNK`}
        </button>
      </div>

      {/* Paytable */}
      <div className="slot-paytable">
        <div className="slot-paytable-title">Paytable</div>
        <div className="slot-pay-row"><span className="slot-pay-combo">💎 💎 💎 💎</span><span className="slot-pay-mult" style={{ color: 'var(--accent-yellow)' }}>×25 — MEGA JACKPOT</span></div>
        <div className="slot-pay-row"><span className="slot-pay-combo">7️⃣ 7️⃣ 7️⃣ 7️⃣</span><span className="slot-pay-mult" style={{ color: 'var(--accent-yellow)' }}>×20 — JACKPOT</span></div>
        <div className="slot-pay-row"><span className="slot-pay-combo">⭐ ⭐ ⭐ ⭐</span><span className="slot-pay-mult" style={{ color: 'var(--accent-orange, #f39c12)' }}>×15 — BIG WIN</span></div>
        <div className="slot-pay-row"><span className="slot-pay-combo">Any 4 same</span><span className="slot-pay-mult" style={{ color: 'var(--accent-green)' }}>×8 — WIN</span></div>
        <div className="slot-pay-row"><span className="slot-pay-combo">Any 3 same</span><span className="slot-pay-mult" style={{ color: 'var(--accent-green)' }}>×5 — WIN</span></div>
        <div className="slot-pay-row"><span className="slot-pay-combo">Any 2 same</span><span className="slot-pay-mult" style={{ color: 'var(--text-secondary)' }}>×1.5 — SMALL WIN</span></div>
        <div className="slot-pay-row"><span className="slot-pay-combo">No match</span><span className="slot-pay-mult" style={{ color: 'var(--accent-red)' }}>×0 — LOSE</span></div>
      </div>
    </>
  );
}
