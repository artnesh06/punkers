'use client';

import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './admin.module.css';
import AdsTab from './AdsTab';

type Tab = 'dashboard' | 'game' | 'config' | 'players' | 'ads';

interface DashboardData {
  stats: { totalUsers: number; totalStaked: number; totalDead: number; totalAlive: number; treasury: number };
  activeGame: any;
  recentGames: any[];
  topPlayers: { rank: number; address: string; points: number; nfts: number }[];
}

interface ScheduleRow { period: string; startDay: number; endDay: number; taxPerDay?: number; baseEarnPerDay?: number }

interface GameConfig {
  totalNFTs: number;
  survivorTarget: number;
  gameDurationDays: number;
  auditGracePeriodHours: number;
  executionGracePeriodHours: number;
  auditPenaltyPercent: number;
  bountyReward: number;
  taxSchedule: ScheduleRow[];
  earnSchedule: ScheduleRow[];
  rarity: { common: number; epic: number; legendary: number; art: number };
}

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/auth').then(r => r.json()).then(d => setAuthed(d.authenticated === true)).catch(() => setAuthed(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (res.ok) setAuthed(true); else setLoginError('Invalid credentials');
  };

  const handleLogout = async () => { await fetch('/api/admin/auth', { method: 'DELETE' }); setAuthed(false); setData(null); };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch('/api/admin/panel'); if (res.ok) setData(await res.json()); } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) loadDashboard(); }, [authed, loadDashboard]);

  const doAction = async (body: Record<string, any>) => {
    setActionMsg('');
    try {
      const res = await fetch('/api/admin/panel/action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      setActionMsg(res.ok ? `✅ Success` : `❌ ${d.error}`);
      if (res.ok) loadDashboard();
    } catch { setActionMsg('❌ Request failed'); }
  };

  if (authed === null) return <div className={styles.page}><LoadingSpinner message="Loading..." size="small" /></div>;

  if (!authed) return (
    <div className={styles.page}>
      <div className={styles.loginWrap}>
        <div className={styles.loginTitle}>🔒 PUNKERS ADMIN</div>
        <form onSubmit={handleLogin} className={styles.loginForm}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className={styles.input} autoComplete="username" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={styles.input} autoComplete="current-password" />
          {loginError && <div className={styles.error}>{loginError}</div>}
          <button type="submit" className={styles.loginBtn}>LOGIN</button>
        </form>
      </div>
    </div>
  );

  const shortenAddr = (a: string) => a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>⚙️ PUNKERS ADMIN</div>
        <button className={styles.logoutBtn} onClick={handleLogout}>LOGOUT</button>
      </div>

      <div className={styles.tabs}>
        {(['dashboard', 'game', 'config', 'players', 'ads'] as Tab[]).map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'dashboard' ? '📊' : t === 'game' ? '🎮' : t === 'config' ? '⚙️' : t === 'players' ? '👥' : '📢'} {t.toUpperCase()}
          </button>
        ))}
      </div>

      {actionMsg && <div className={styles.actionMsg}>{actionMsg}</div>}

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>📊 Overview</div>
          {loading ? <LoadingSpinner message="Loading..." size="small" /> : data && (<>
            <div className={styles.statsGrid}>
              <StatCard label="TOTAL USERS" value={data.stats.totalUsers} />
              <StatCard label="ALIVE" value={data.stats.totalAlive} color="green" />
              <StatCard label="DEAD" value={data.stats.totalDead} color="red" />
              <StatCard label="STAKED" value={data.stats.totalStaked} />
              <StatCard label="TREASURY $PUNK" value={data.stats.treasury} color="yellow" />
            </div>
            {data.activeGame && (
              <div className={styles.card}>
                <div className={styles.cardTitle}>🎮 Active Game</div>
                <Row label="Season" value={`${data.activeGame.season} — ${data.activeGame.name}`} />
                <Row label="Day" value={data.activeGame.currentGameDay} color="yellow" />
                <Row label="Tax Rate" value={`${data.activeGame.currentTaxRate} $PUNK`} color="red" />
                <Row label="Survivors" value={data.activeGame.survivorsRemaining} color="green" />
                <Row label="Target" value={data.activeGame.survivorTarget} />
                <Row label="Duration" value={`${data.activeGame.durationDays} days`} />
              </div>
            )}
            {!data.activeGame && <div className={styles.card}><div className={styles.cardTitle}>No active game</div><p style={{color:'#666',fontSize:'13px'}}>Create and start a game from the Game tab.</p></div>}
          </>)}
        </div>
      )}

      {/* ── GAME MANAGEMENT ── */}
      {tab === 'game' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>🎮 Game Management</div>
          {data?.recentGames && data.recentGames.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>Recent Games</div>
              <table className={styles.table}>
                <thead><tr><th>Season</th><th>Name</th><th>Status</th><th>Start</th><th>Survivors</th><th>Dead</th><th>Action</th></tr></thead>
                <tbody>
                  {data.recentGames.map((g: any) => (
                    <tr key={g.id}>
                      <td>{g.season}</td>
                      <td>{g.name}</td>
                      <td><span className={`${styles.badge} ${styles[`badge_${g.status}`]}`}>{g.status.toUpperCase()}</span></td>
                      <td>{new Date(g.startDate).toLocaleDateString()}</td>
                      <td className={styles.green}>{g.totalSurvivors || '—'}</td>
                      <td className={styles.red}>{g.totalDead || '—'}</td>
                      <td>
                        {g.status === 'pending' && <button className={styles.actionBtn} onClick={() => doAction({ action: 'startGame', gameId: g.id })}>▶ START</button>}
                        {g.status === 'active' && <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={() => { if (confirm('End this game and generate winners?')) doAction({ action: 'endGame', gameId: g.id }); }}>⏹ END</button>}
                        {g.status === 'ended' && <span style={{color:'#666',fontSize:'11px'}}>Completed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <CreateGameForm onSubmit={(p) => doAction({ action: 'createGame', ...p })} />
        </div>
      )}

      {/* ── CONFIG ── */}
      {tab === 'config' && <ConfigTab />}

      {/* ── PLAYERS ── */}
      {tab === 'players' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>👥 Top Players</div>
          {data?.topPlayers && data.topPlayers.length > 0 ? (
            <table className={styles.table}>
              <thead><tr><th>#</th><th>Address</th><th>$PUNK</th><th>NFTs</th></tr></thead>
              <tbody>{data.topPlayers.map(p => (
                <tr key={p.address}><td>{p.rank}</td><td style={{fontFamily:'monospace'}}>{shortenAddr(p.address)}</td><td className={styles.green}>{p.points.toLocaleString()}</td><td>{p.nfts}</td></tr>
              ))}</tbody>
            </table>
          ) : <p style={{color:'#666',fontSize:'13px'}}>No players yet.</p>}
        </div>
      )}

      {/* ── ADS ── */}
      {tab === 'ads' && <AdsTab />}
    </div>
  );
}

/* ── Helper Components ── */

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className={styles.statCard}>
      <div className={`${styles.statVal} ${color ? styles[color] : ''}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className={styles.statLbl}>{label}</div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className={styles.cardRow}>
      <span>{label}</span>
      <span className={color ? styles[color] : ''}>{value}</span>
    </div>
  );
}

function CreateGameForm({ onSubmit }: { onSubmit: (p: any) => void }) {
  const [season, setSeason] = useState(1);
  const [name, setName] = useState('Season 1');
  const [durationDays, setDurationDays] = useState(60);
  const [survivorTarget, setSurvivorTarget] = useState(500);

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>➕ Create New Game</div>
      <div className={styles.formGrid}>
        <label className={styles.formLabel}>Season<input type="number" className={styles.input} value={season} onChange={e => setSeason(Number(e.target.value))} min={1} /></label>
        <label className={styles.formLabel}>Name<input type="text" className={styles.input} value={name} onChange={e => setName(e.target.value)} /></label>
        <label className={styles.formLabel}>Duration (days)<input type="number" className={styles.input} value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} min={1} /></label>
        <label className={styles.formLabel}>Survivor Target<input type="number" className={styles.input} value={survivorTarget} onChange={e => setSurvivorTarget(Number(e.target.value))} min={1} /></label>
      </div>
      <button className={styles.submitBtn} onClick={() => onSubmit({ season, name, startDate: new Date().toISOString(), durationDays, survivorTarget })}>CREATE GAME</button>
    </div>
  );
}

/* ── Editable Config Tab ── */

function ConfigTab() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/panel/config').then(r => r.json()).then(d => {
      if (d.config) setConfig(d.config);
    }).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/panel/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setMsg(res.ok ? '✅ Config saved!' : '❌ Failed to save');
    } catch {
      setMsg('❌ Request failed');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: number) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const updateTax = (idx: number, field: string, value: number) => {
    setConfig((prev: any) => {
      const arr = [...prev.taxSchedule];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, taxSchedule: arr };
    });
  };

  const updateEarn = (idx: number, field: string, value: number) => {
    setConfig((prev: any) => {
      const arr = [...prev.earnSchedule];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, earnSchedule: arr };
    });
  };

  const updateRarity = (key: string, value: number) => {
    setConfig((prev: any) => ({ ...prev, rarity: { ...prev.rarity, [key]: value } }));
  };

  if (!config) return <div className={styles.section}><div className={styles.loading}>Loading config...</div></div>;

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>⚙️ Game Configuration</div>

      {msg && <div className={styles.actionMsg}>{msg}</div>}

      {/* Game Rules */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Game Rules</div>
        <div className={styles.formGrid}>
          <label className={styles.formLabel}>Total NFTs<input type="number" className={styles.input} value={config.totalNFTs} onChange={e => updateField('totalNFTs', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>Survivor Target<input type="number" className={styles.input} value={config.survivorTarget} onChange={e => updateField('survivorTarget', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>Game Duration (days)<input type="number" className={styles.input} value={config.gameDurationDays} onChange={e => updateField('gameDurationDays', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>Audit Grace (hours)<input type="number" className={styles.input} value={config.auditGracePeriodHours} onChange={e => updateField('auditGracePeriodHours', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>Execution Grace (hours)<input type="number" className={styles.input} value={config.executionGracePeriodHours} onChange={e => updateField('executionGracePeriodHours', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>Audit Penalty (%)<input type="number" className={styles.input} value={config.auditPenaltyPercent} onChange={e => updateField('auditPenaltyPercent', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>Bounty Reward ($PUNK)<input type="number" className={styles.input} value={config.bountyReward} onChange={e => updateField('bountyReward', Number(e.target.value))} /></label>
        </div>
      </div>

      {/* Tax Schedule */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Tax Schedule</div>
        <table className={styles.table}>
          <thead><tr><th>Period</th><th>Start Day</th><th>End Day</th><th>Tax/Day ($PUNK)</th></tr></thead>
          <tbody>
            {config.taxSchedule?.map((row: any, i: number) => (
              <tr key={i}>
                <td>{row.period}</td>
                <td><input type="number" className={styles.inputSmall} value={row.startDay} onChange={e => updateTax(i, 'startDay', Number(e.target.value))} /></td>
                <td><input type="number" className={styles.inputSmall} value={row.endDay} onChange={e => updateTax(i, 'endDay', Number(e.target.value))} /></td>
                <td><input type="number" className={styles.inputSmall} value={row.taxPerDay} onChange={e => updateTax(i, 'taxPerDay', Number(e.target.value))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Earning Schedule */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Earning Schedule (Base — Common 1.0x)</div>
        <table className={styles.table}>
          <thead><tr><th>Period</th><th>Start Day</th><th>End Day</th><th>Earn/Day ($PUNK)</th></tr></thead>
          <tbody>
            {config.earnSchedule?.map((row: any, i: number) => (
              <tr key={i}>
                <td>{row.period}</td>
                <td><input type="number" className={styles.inputSmall} value={row.startDay} onChange={e => updateEarn(i, 'startDay', Number(e.target.value))} /></td>
                <td><input type="number" className={styles.inputSmall} value={row.endDay} onChange={e => updateEarn(i, 'endDay', Number(e.target.value))} /></td>
                <td><input type="number" className={styles.inputSmall} value={row.baseEarnPerDay} onChange={e => updateEarn(i, 'baseEarnPerDay', Number(e.target.value))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rarity Multipliers */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Rarity Multipliers</div>
        <div className={styles.formGrid}>
          <label className={styles.formLabel}>Common<input type="number" step="0.01" className={styles.input} value={config.rarity?.common} onChange={e => updateRarity('common', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>Epic<input type="number" step="0.01" className={styles.input} value={config.rarity?.epic} onChange={e => updateRarity('epic', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>Legendary<input type="number" step="0.01" className={styles.input} value={config.rarity?.legendary} onChange={e => updateRarity('legendary', Number(e.target.value))} /></label>
          <label className={styles.formLabel}>1/1 Art<input type="number" step="0.01" className={styles.input} value={config.rarity?.art} onChange={e => updateRarity('art', Number(e.target.value))} /></label>
        </div>
      </div>

      {/* Save Button */}
      <button className={styles.submitBtn} onClick={save} disabled={saving} style={{ width: '100%', marginTop: '8px' }}>
        {saving ? '⏳ SAVING...' : '💾 SAVE ALL CONFIGURATION'}
      </button>
    </div>
  );
}
