'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import styles from './profile.module.css';
import adStyles from './ads.module.css';
import modalStyles from './nft-modal.module.css';

interface ProfileData {
  address: string;
  balance: number;
  nftsOwned: number;
  aliveNFTs: number;
  deadNFTs: number;
  totalAudits: number;
  totalExecutions: number;
  title: string;
  maxDaysSurvived: number;
}

interface NFTData {
  tokenId: string;
  rarity: string;
  health: number;
  status: string;
  isStaked: boolean;
  metadata?: {
    name?: string;
    image?: string;
  };
}

interface AdData {
  id: string;
  message: string;
  status: string;
  cost: number;
  durationHours: number;
  startDate: string;
  expireDate: string;
  isVisible: boolean;
  remainingMs: number;
}

interface PricingPackage {
  id: string;
  name: string;
  durationHours: number;
  price: number;
}

const LEVEL_CONFIG: Record<string, { level: number; color: string }> = {
  LEGEND:   { level: 4, color: '#00ff66' },
  VETERAN:  { level: 3, color: '#b44dff' },
  ELITE:    { level: 2, color: '#ffcc00' },
  SURVIVOR: { level: 1, color: '#e53030' },
};

function getRarityColor(rarity: string): string {
  const r = rarity?.toLowerCase();
  if (r === 'legendary') return '#ffcc00';
  if (r === 'epic') return '#b44dff';
  if (r === 'art' || r === '1/1') return '#ff2d95';
  if (r === 'rare') return '#4d9fff';
  return '#555';
}

function getRarityAttr(rarity: string): string {
  const r = rarity?.toLowerCase();
  if (r === 'legendary') return 'legendary';
  if (r === 'epic') return 'epic';
  if (r === 'art' || r === '1/1') return '1/1 art';
  if (r === 'rare') return 'rare';
  return 'common';
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Expired';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h left`;
  }
  return `${hours}h ${mins}m left`;
}

export default function ProfileClient() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);

  // Ads state
  const [ads, setAds] = useState<AdData[]>([]);
  const [adBalance, setAdBalance] = useState(0);
  const [pricing, setPricing] = useState<PricingPackage[]>([]);
  const [showAdForm, setShowAdForm] = useState(false);
  const [adMessage, setAdMessage] = useState('');
  const [selectedPricing, setSelectedPricing] = useState('');
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [adError, setAdError] = useState('');
  const [allAds, setAllAds] = useState<AdData[]>([]);
  
  // NFT Modal state
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [showNFTModal, setShowNFTModal] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      Promise.all([loadProfile(), loadNFTs(), loadAds(), loadPricing(), loadAllAds()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Duplicate ticker content for seamless infinite scroll
  useEffect(() => {
    if (allAds.length === 0) return;
    
    const ticker = document.getElementById('adTicker');
    if (!ticker) return;

    // Duplicate content for seamless loop
    const original = ticker.innerHTML;
    ticker.innerHTML = original + original;

    // Pause on hover
    const banner = ticker.closest(`.${styles.adBanner}`);
    if (banner) {
      const handleMouseEnter = () => ticker.classList.add(styles.paused);
      const handleMouseLeave = () => ticker.classList.remove(styles.paused);
      
      banner.addEventListener('mouseenter', handleMouseEnter);
      banner.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        banner.removeEventListener('mouseenter', handleMouseEnter);
        banner.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [allAds]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/user/profile?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

  const loadNFTs = async () => {
    try {
      const res = await fetch(`/api/nft/list?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setNfts(data.nfts || []);
      }
    } catch (e) {
      console.error('Error loading NFTs:', e);
    }
  };

  const loadAds = async () => {
    try {
      const res = await fetch(`/api/ads/my?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        setAds(data.ads || []);
        setAdBalance(data.balance || 0);
      }
    } catch (e) {
      console.error('Error loading ads:', e);
    }
  };

  const loadPricing = async () => {
    try {
      const res = await fetch('/api/ads/pricing');
      if (res.ok) {
        const data = await res.json();
        setPricing(data.packages || []);
      }
    } catch (e) {
      console.error('Error loading pricing:', e);
    }
  };

  const loadAllAds = async () => {
    try {
      const res = await fetch('/api/ads/active');
      if (res.ok) {
        const data = await res.json();
        setAllAds(data.ads || []);
      }
    } catch (e) {
      console.error('Error loading all ads:', e);
    }
  };

  const handleCreateAd = async () => {
    if (!selectedPricing || !adMessage.trim()) return;
    setAdSubmitting(true);
    setAdError('');
    try {
      const res = await fetch('/api/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message: adMessage.trim(), pricingId: selectedPricing }),
      });
      const data = await res.json();
      if (data.success) {
        setAdMessage('');
        setSelectedPricing('');
        setShowAdForm(false);
        loadAds();
      } else {
        setAdError(data.error || 'Failed to create ad');
      }
    } catch {
      setAdError('Request failed');
    } finally {
      setAdSubmitting(false);
    }
  };

  const handleToggleAd = async (adId: string) => {
    try {
      const res = await fetch(`/api/ads/${adId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (res.ok) loadAds();
    } catch (e) {
      console.error('Error toggling ad:', e);
    }
  };

  const openNFTModal = (nft: NFTData) => {
    setSelectedNFT(nft);
    setShowNFTModal(true);
  };

  const closeNFTModal = () => {
    setShowNFTModal(false);
    setTimeout(() => setSelectedNFT(null), 200);
  };

  const handleDownloadCard = () => {
    if (!selectedNFT) return;
    alert('Download card feature coming soon!');
  };

  const handleViewOnOpenSea = () => {
    if (!selectedNFT) return;
    const openseaUrl = `https://opensea.io/assets/ethereum/YOUR_CONTRACT_ADDRESS/${selectedNFT.tokenId}`;
    window.open(openseaUrl, '_blank');
  };

  const handleOnchainStatus = () => {
    if (!selectedNFT) return;
    const etherscanUrl = `https://etherscan.io/token/YOUR_CONTRACT_ADDRESS?a=${selectedNFT.tokenId}`;
    window.open(etherscanUrl, '_blank');
  };

  if (!isConnected) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: 'var(--accent-red)', fontSize: '24px' }}>WALLET NOT CONNECTED</h2>
          <p style={{ color: 'var(--text-muted)' }}>Connect your wallet to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  const cfg = LEVEL_CONFIG[profile?.title || 'SURVIVOR'] || LEVEL_CONFIG.SURVIVOR;
  const levelLabel = `⚡ LVL ${cfg.level}`;
  const totalPoints = profile?.balance || 0;

  const activeAds = ads.filter(a => a.status === 'ACTIVE').length;
  const expiredAds = ads.filter(a => a.status === 'EXPIRED').length;
  const selectedPkg = pricing.find(p => p.id === selectedPricing);

  return (
    <div className={styles.page}>
      {/* Back Button */}
      <button className={styles.backBtn} onClick={() => window.history.back()}>
        ← Back
      </button>

      {/* Ad Banner - Infinite Scroll */}
      {allAds.length > 0 && (
        <div className={styles.adBanner}>
          <div className={styles.adTickerWrap}>
            <div className={styles.adTicker} id="adTicker">
              {allAds.map((ad, idx) => (
                <span key={idx} className={styles.adItem}>
                  | {ad.message} | by {shortenAddress(ad.id)} |
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className={styles.hero}>
        <div className={styles.heroNoise} />
        <div className={styles.heroGrid} />
        <div className={styles.heroGlow} />
        <div className={styles.heroScan} />
        <div className={styles.heroCert}>
          <div className={styles.heroCertFrame} style={{ borderColor: cfg.color, boxShadow: `0 0 20px ${cfg.color}44` }}>
            💀
          </div>
          <div className={styles.heroCertLabel} style={{ color: cfg.color, borderColor: cfg.color }}>
            {levelLabel}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className={styles.identity}>
        <div className={styles.pfpWrap}>
          <div className={styles.pfp}>
            {nfts[0]?.metadata?.image ? (
              <img src={nfts[0].metadata.image} alt="PFP" />
            ) : (
              '💀'
            )}
          </div>
        </div>
        <div className={styles.identityInfo}>
          <div className={styles.address}>{shortenAddress(address || '')}</div>
          <div className={styles.handle}>Punker</div>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${styles.badgePunker}`}>
              💀 {profile?.nftsOwned || 0} PUNKERS
            </span>
            <span className={styles.badge} style={{ borderColor: `${cfg.color}4d`, color: cfg.color }}>
              {levelLabel} {profile?.title}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statVal}>{profile?.nftsOwned ?? '—'}</span>
          <span className={styles.statLbl}>Punkers</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statVal} ${styles.yellow}`}>{totalPoints.toLocaleString()}</span>
          <span className={styles.statLbl}>$PUNK</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statVal} ${styles.yellow}`}>{totalPoints.toLocaleString()}</span>
          <span className={styles.statLbl}>Points</span>
        </div>
        <div className={styles.stat}>
          <span className={`${styles.statVal} ${styles.red}`}>{profile?.totalExecutions ?? '—'}</span>
          <span className={styles.statLbl}>Kills</span>
        </div>
      </div>

      {/* Collection */}
      <div className={styles.sectionLabel}>💀 Collection</div>

      {nfts.length === 0 ? (
        <div className={styles.empty} style={{ padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
          <p style={{ color: 'var(--text-muted)' }}>No Punkers found in this wallet.</p>
        </div>
      ) : (
        <div className={styles.nftGrid}>
          {nfts.map((nft) => {
            const rc = getRarityColor(nft.rarity);
            const rarityAttr = getRarityAttr(nft.rarity);
            const isDead = nft.status === 'RIP' || nft.health <= 0;
            const isAudited = nft.status === 'Audited';
            const dataStatus = isDead ? 'dead' : isAudited ? 'audited' : 'alive';
            const hpColor = nft.health >= 75 ? 'var(--accent-green)' : nft.health >= 40 ? 'var(--accent-yellow)' : 'var(--accent-red)';

            return (
              <div
                key={nft.tokenId}
                className={styles.nftCard}
                data-rarity={rarityAttr}
                data-status={dataStatus}
                onClick={() => openNFTModal(nft)}
              >
                <div className={styles.nftArt} style={{ borderTopColor: rc }}>
                  {nft.metadata?.image ? (
                    <img src={nft.metadata.image} alt={nft.metadata?.name || `#${nft.tokenId}`} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', background: '#111' }}>
                      💀
                    </div>
                  )}
                </div>
                <div className={styles.nftInfo}>
                  <div className={styles.nftName}>{nft.metadata?.name || `Punker #${nft.tokenId}`}</div>
                  <div className={styles.nftMeta}>
                    <span className={styles.nftRarity} style={{ color: rc }}>
                      {nft.rarity || 'Common'}
                    </span>
                    <span className={styles.nftPts} style={{ color: hpColor }}>
                      {nft.health}% HP
                    </span>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    {isDead ? (
                      <span className={styles.statusBadgeDead}>🪦 RIP</span>
                    ) : isAudited ? (
                      <span className={styles.statusBadgeAudited}>⚠️ UNPAID</span>
                    ) : (
                      <span className={styles.statusBadgeAlive}>✓ ALIVE</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ ADS SECTION ═══ */}
      <div className={styles.sectionLabel}>📢 My Ads</div>

      <div className={adStyles.adsSection}>
        <div className={adStyles.adsStats}>
          <span className={adStyles.active}>● {activeAds} Active</span>
          <span className={adStyles.expired}>● {expiredAds} Expired</span>
          <span className={adStyles.balance}>💰 {adBalance.toLocaleString()} $PUNK</span>
        </div>

        <button className={adStyles.createBtn} onClick={() => setShowAdForm(!showAdForm)}>
          {showAdForm ? '✕ CANCEL' : '+ CREATE AD'}
        </button>

        {showAdForm && (
          <div className={adStyles.form}>
            <div className={adStyles.formTitle}>📣 Create Advertisement</div>

            <textarea
              className={adStyles.textarea}
              placeholder="Your ad message (max 100 chars)..."
              maxLength={100}
              value={adMessage}
              onChange={e => setAdMessage(e.target.value)}
            />
            <div className={`${adStyles.charCount} ${adMessage.length > 80 ? adStyles.warning : ''} ${adMessage.length >= 100 ? adStyles.danger : ''}`}>
              {adMessage.length}/100
            </div>

            <div className={adStyles.selectRow}>
              <select
                className={adStyles.select}
                value={selectedPricing}
                onChange={e => setSelectedPricing(e.target.value)}
              >
                <option value="">Select duration...</option>
                {pricing.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price.toLocaleString()} $PUNK
                  </option>
                ))}
              </select>
              {selectedPkg && (
                <span className={adStyles.pricePreview}>
                  {selectedPkg.price.toLocaleString()} $PUNK for {selectedPkg.name}
                </span>
              )}
            </div>

            <div className={adStyles.formActions}>
              <button
                className={adStyles.submitBtn}
                onClick={handleCreateAd}
                disabled={adSubmitting || !adMessage.trim() || !selectedPricing}
              >
                {adSubmitting ? '⏳ SUBMITTING...' : `📣 SUBMIT — ${selectedPkg ? selectedPkg.price.toLocaleString() : '0'} $PUNK`}
              </button>
            </div>

            {adError && <div className={adStyles.error}>{adError}</div>}
          </div>
        )}

        {ads.length === 0 ? (
          <div className={adStyles.empty}>No ads yet. Create one to promote your message!</div>
        ) : (
          ads.map(ad => (
            <div key={ad.id} className={adStyles.adCard}>
              <span className={adStyles.adMsg}>{ad.message}</span>
              <div className={adStyles.adMeta}>
                <span className={`${adStyles.adStatus} ${
                  ad.status === 'ACTIVE' ? adStyles.live :
                  ad.status === 'PAUSED' ? adStyles.paused :
                  adStyles.expired
                }`}>
                  {ad.status === 'ACTIVE' ? '✓ LIVE' : ad.status === 'PAUSED' ? '⏸ PAUSED' : 'EXPIRED'}
                </span>
                <span className={adStyles.adTime}>
                  {ad.status !== 'EXPIRED' ? formatRemaining(ad.remainingMs) : 'Expired'}
                </span>
              </div>
              {ad.status !== 'EXPIRED' && (
                <button
                  className={`${adStyles.toggleBtn} ${ad.status === 'ACTIVE' ? adStyles.pause : adStyles.resume}`}
                  onClick={() => handleToggleAd(ad.id)}
                >
                  {ad.status === 'ACTIVE' ? '⏸ PAUSE' : '▶ RESUME'}
                </button>
              )}
            </div>
          ))
        )}
