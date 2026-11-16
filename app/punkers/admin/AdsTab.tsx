'use client';

import { useState, useEffect } from 'react';
import styles from './admin.module.css';

type AdFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';

interface AdItem {
  id: string;
  message: string;
  status: string;
  cost: number;
  durationHours: number;
  startDate: string;
  expireDate: string;
  isVisible: boolean;
  createdAt: string;
  user: { address: string };
}

interface PricingItem {
  id: string;
  name: string;
  durationHours: number;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

function shortenAddr(a: string) {
  return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '';
}

export default function AdsTab() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0 });
  const [filter, setFilter] = useState<AdFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // New pricing form
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(24);
  const [newPrice, setNewPrice] = useState(100);
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [showNewPricing, setShowNewPricing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adsRes, pricingRes] = await Promise.all([
        fetch('/api/admin/ads'),
        fetch('/api/admin/ads/pricing'),
      ]);
      if (adsRes.ok) {
        const d = await adsRes.json();
        setAds(d.ads || []);
        setStats(d.stats || { total: 0, active: 0, revenue: 0 });
      }
      if (pricingRes.ok) {
        const d = await pricingRes.json();
        setPricing(d.packages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ads/${id}`, { method: 'PUT' });
      if (res.ok) {
        setMsg('✅ Visibility toggled');
        loadData();
      } else {
        setMsg('❌ Failed to toggle');
      }
    } catch {
      setMsg('❌ Request failed');
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    try {
      const res = await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('✅ Ad deleted');
        loadData();
      } else {
        setMsg('❌ Failed to delete');
      }
    } catch {
      setMsg('❌ Request failed');
    }
  };

  const createPricing = async () => {
    if (!newName) return;
    try {
      const res = await fetch('/api/admin/ads/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, durationHours: newDuration, price: newPrice, sortOrder: newSortOrder }),
      });
      if (res.ok) {
        setMsg('✅ Pricing created');
        setNewName('');
        setNewDuration(24);
        setNewPrice(100);
        setShowNewPricing(false);
        loadData();
      } else {
        const d = await res.json();
        setMsg(`❌ ${d.error}`);
      }
    } catch {
      setMsg('❌ Request failed');
    }
  };

  const updatePricing = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/admin/ads/pricing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setMsg('✅ Pricing updated');
        loadData();
      } else {
        setMsg('❌ Failed to update');
      }
    } catch {
      setMsg('❌ Request failed');
    }
  };

  const deletePricing = async (id: string) => {
    if (!confirm('Delete this pricing package?')) return;
    try {
      const res = await fetch(`/api/admin/ads/pricing/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg('✅ Pricing deleted');
        loadData();
      } else {
        setMsg('❌ Failed to delete');
      }
    } catch {
      setMsg('❌ Request failed');
    }
  };

  const filteredAds = filter === 'ALL' ? ads : ads.filter(a => a.status === filter);

  if (loading) return <div className={styles.section}><div className={styles.loading}>Loading ads data...</div></div>;

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>📢 Ads Management</div>

      {msg && <div className={styles.actionMsg}>{msg}</div>}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{stats.total}</div>
          <div className={styles.statLbl}>Total Ads</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statVal} ${styles.green}`}>{stats.active}</div>
          <div className={styles.statLbl}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statVal} ${styles.yellow}`}>{stats.revenue.toLocaleString()}</div>
          <div className={styles.statLbl}>Revenue $PUNK</div>
        </div>
      </div>

      {/* ── Pricing Management ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>💰 Pricing Packages</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Duration (h)</th>
              <th>Price ($PUNK)</th>
              <th>Active</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>
                  <input
                    type="number"
                    className={styles.inputSmall}
                    value={p.durationHours}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setPricing(prev => prev.map(item => item.id === p.id ? { ...item, durationHours: val } : item));
                      updatePricing(p.id, { durationHours: val });
                    }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.inputSmall}
                    value={p.price}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setPricing(prev => prev.map(item => item.id === p.id ? { ...item, price: val } : item));
                      updatePricing(p.id, { price: val });
                    }}
                  />
                </td>
                <td>
                  <button
                    className={styles.actionBtn}
                    style={{ fontSize: '10px', padding: '4px 8px', background: p.isActive ? 'rgba(0,255,102,0.1)' : 'rgba(229,48,48,0.1)', borderColor: p.isActive ? 'rgba(0,255,102,0.3)' : 'rgba(229,48,48,0.3)', color: p.isActive ? '#00ff66' : '#e53030' }}
                    onClick={() => updatePricing(p.id, { isActive: !p.isActive })}
                  >
                    {p.isActive ? 'ON' : 'OFF'}
                  </button>
                </td>
                <td>
                  <input
                    type="number"
                    className={styles.inputSmall}
                    style={{ width: '50px' }}
                    value={p.sortOrder}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setPricing(prev => prev.map(item => item.id === p.id ? { ...item, sortOrder: val } : item));
                      updatePricing(p.id, { sortOrder: val });
                    }}
                  />
                </td>
                <td>
                  <button className={`${styles.actionBtn} ${styles.dangerBtn}`} onClick={() => deletePricing(p.id)} style={{ fontSize: '10px', padding: '4px 8px' }}>
                    DEL
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showNewPricing ? (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className={styles.input} style={{ width: '120px' }} placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} />
            <input className={styles.input} style={{ width: '80px' }} type="number" placeholder="Hours" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} />
            <input className={styles.input} style={{ width: '80px' }} type="number" placeholder="Price" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} />
            <input className={styles.input} style={{ width: '60px' }} type="number" placeholder="Sort" value={newSortOrder} onChange={e => setNewSortOrder(Number(e.target.value))} />
            <button className={styles.actionBtn} onClick={createPricing}>CREATE</button>
            <button className={styles.actionBtn} onClick={() => setShowNewPricing(false)} style={{ color: '#888', borderColor: '#333' }}>CANCEL</button>
          </div>
        ) : (
          <button className={styles.actionBtn} style={{ marginTop: '12px' }} onClick={() => setShowNewPricing(true)}>
            + ADD PACKAGE
          </button>
        )}
      </div>

      {/* ── Ads Management ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>📋 All Ads</div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {(['ALL', 'ACTIVE', 'PAUSED', 'EXPIRED'] as AdFilter[]).map(f => (
            <button
              key={f}
              className={`${styles.actionBtn}`}
              style={{
                fontSize: '10px',
                padding: '4px 12px',
                background: filter === f ? 'rgba(229,48,48,0.15)' : 'transparent',
                borderColor: filter === f ? 'rgba(229,48,48,0.5)' : '#333',
                color: filter === f ? '#e53030' : '#888',
              }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Message</th>
                <th>User</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Duration</th>
                <th>Expires</th>
                <th>Visible</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#666', padding: '24px' }}>No ads found</td></tr>
              ) : (
                filteredAds.map(ad => (
                  <tr key={ad.id}>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.message}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{shortenAddr(ad.user?.address || '')}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        ad.status === 'ACTIVE' ? styles.badge_active :
                        ad.status === 'PAUSED' ? styles.badge_pending :
                        styles.badge_ended
                      }`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className={styles.yellow}>{ad.cost.toLocaleString()}</td>
                    <td>{ad.durationHours}h</td>
                    <td style={{ fontSize: '11px', color: '#888' }}>
                      {new Date(ad.expireDate).toLocaleString()}
                    </td>
                    <td>
                      <span style={{ color: ad.isVisible ? '#00ff66' : '#e53030', fontSize: '11px' }}>
                        {ad.isVisible ? 'YES' : 'HIDDEN'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className={styles.actionBtn}
                          style={{ fontSize: '10px', padding: '4px 8px' }}
                          onClick={() => toggleVisibility(ad.id)}
                        >
                          {ad.isVisible ? 'HIDE' : 'SHOW'}
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.dangerBtn}`}
                          style={{ fontSize: '10px', padding: '4px 8px' }}
                          onClick={() => deleteAd(ad.id)}
                        >
                          DEL
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
