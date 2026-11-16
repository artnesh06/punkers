'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/lib/hooks/useToast';
import styles from './profile.module.css';
import adStyles from './ads.module.css';
import NFTModal from '@/components/game/NFTModal';
import CertificateModal from '@/components/game/CertificateModal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SocialData {
  discord: string | null;
  discordUsername: string | null;
  twitter: string | null;
  twitterUsername: string | null;
}

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
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Social state
  const [social, setSocial] = useState<SocialData>({ discord: null, discordUsername: null, twitter: null, twitterUsername: null });
  const [disconnectingSocial, setDisconnectingSocial] = useState<string | null>(null);
  
  // NFT Modal state
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [showNFTModal, setShowNFTModal] = useState(false);
  
  // PFP Selector state
  const [showPfpSelector, setShowPfpSelector] = useState(false);
  const [selectedPfp, setSelectedPfp] = useState<string | null>(null);

  // Certificate Modal state
  const [showCertificate, setShowCertificate] = useState(false);

  // Ads state
  const [ads, setAds] = useState<AdData[]>([]);
  const [adBalance, setAdBalance] = useState(0);
  const [pricing, setPricing] = useState<PricingPackage[]>([]);
  const [showAdForm, setShowAdForm] = useState(false);
  const [adMessage, setAdMessage] = useState('');
  const [selectedPricing, setSelectedPricing] = useState('');
  const [adSubmitting, setAdSubmitting] = useState(false);
  const [adError, setAdError] = useState('');
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle OAuth redirect — show toast for success/error (same as WalletButton)
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
      setLoading(true);
      Promise.all([
        loadProfile(), 
        loadNFTs(),
        loadSavedPfp(),
        loadAds(),
        loadPricing(),
        fetchSocial()
      ])
        .catch(err => console.error('Error loading profile data:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/user/profile?address=${address}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (e) {
      console.error('Error loading profile:', e);
    }
  };

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
      console.error('Error fetching social:', e);
    }
  };

  const connectDiscord = () => {
    if (!address) return;
    window.location.href = `/api/auth/discord?address=${address}&redirect=/profile`;
  };

  const connectTwitter = () => {
    if (!address) return;
    window.location.href = `/api/auth/twitter?address=${address}&redirect=/profile`;
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

  const loadNFTs = async () => {
    try {
      const res = await fetch(`/api/nft/list?address=${address}`, {
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const data = await res.json();
        setNfts(data.nfts || []);
      }
    } catch (e) {
      console.error('Error loading NFTs:', e);
    }
  };

  const loadSavedPfp = async () => {
    try {
      const res = await fetch(`/api/user/pfp?address=${address}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tokenId) {
          setSelectedPfp(data.tokenId);
        }
      }
    } catch (e) {
      console.error('Error loading saved PFP:', e);
    }
  };

  const handleSelectPfp = async (tokenId: string) => {
    setSelectedPfp(tokenId);
    setShowPfpSelector(false);
    
    // Get the selected NFT image
    const selectedNft = nfts.find(n => n.tokenId === tokenId);
    const imageUrl = selectedNft?.metadata?.image;
    
    console.log('Selected PFP:', tokenId, 'Image:', imageUrl);
    
    // Save to database
    try {
      const res = await fetch('/api/user/pfp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, tokenId }),
      });
      if (res.ok) {
        console.log('Saved to database, updating localStorage');
        // Save to localStorage with address key for instant navbar update
        if (imageUrl) {
          localStorage.setItem(`pfpImage_${address}`, imageUrl);
        }
      }
    } catch (e) {
      console.error('Error saving PFP:', e);
    }
  };

  const getCurrentPfp = () => {
    if (!selectedPfp) return nfts[0];
    return nfts.find(n => n.tokenId === selectedPfp) || nfts[0];
  };

  const loadAds = async () => {
    try {
      const res = await fetch(`/api/ads/my?address=${address}`, {
        signal: AbortSignal.timeout(10000)
      });
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
      const res = await fetch('/api/ads/pricing', {
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) {
        const data = await res.json();
        setPricing(data.packages || []);
      }
    } catch (e) {
      console.error('Error loading pricing:', e);
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

  const handleEditAd = async (adId: string) => {
    if (!editMessage.trim()) return;
    setAdSubmitting(true);
    setAdError('');
    try {
      const res = await fetch(`/api/ads/${adId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, message: editMessage.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingAdId(null);
        setEditMessage('');
        loadAds();
      } else {
        setAdError(data.error || 'Failed to edit ad');
      }
    } catch {
      setAdError('Request failed');
    } finally {
      setAdSubmitting(false);
    }
  };

  const startEditAd = (ad: AdData) => {
    setEditingAdId(ad.id);
    setEditMessage(ad.message);
    setAdError('');
  };

  const cancelEditAd = () => {
    setEditingAdId(null);
    setEditMessage('');
    setAdError('');
  };

  const openNFTModal = (nft: NFTData) => {
    setSelectedNFT(nft);
    setShowNFTModal(true);
  };

  const closeNFTModal = () => {
    setShowNFTModal(false);
    setTimeout(() => setSelectedNFT(null), 200);
  };

  if (!isConnected || !address) {
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
        <LoadingSpinner message="Loading profile..." />
      </div>
    );
  }

  const cfg = LEVEL_CONFIG[profile?.title || 'SURVIVOR'] || LEVEL_CONFIG.SURVIVOR;
  const levelLabel = `⚡ LVL ${cfg.level}`;
  const totalPoints = profile?.balance || 0;
  const currentPfp = getCurrentPfp();

  const activeAds = ads.filter(a => a.status === 'ACTIVE').length;
  const expiredAds = ads.filter(a => a.status === 'EXPIRED').length;
  const selectedPkg = pricing.find(p => p.id === selectedPricing);

  return (
    <div className={styles.page}>
      {/* Identity */}
      <div className={styles.identity} style={{ marginTop: '24px' }}>
        <div className={styles.pfpWrap}>
          <div 
            className={styles.pfp} 
            style={{ borderColor: cfg.color, boxShadow: `0 0 20px ${cfg.color}44` }}
            onClick={() => setShowPfpSelector(true)}
          >
            {currentPfp?.metadata?.image ? (
              <img src={currentPfp.metadata.image} alt="PFP" />
            ) : (
              '💀'
            )}
            <div className={styles.pfpOverlay}>
              <span className={styles.pfpOverlayIcon}>📷</span>
              <span className={styles.pfpOverlayText}>Change PFP</span>
            </div>
          </div>
        </div>
        <div className={styles.identityInfo}>
          <div className={styles.address}>{shortenAddress(address || '')}</div>
          <div className={styles.handle}>Punker</div>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${styles.badgePunker}`}>
              {profile?.nftsOwned || 0} PUNKERS
            </span>
            <button 
              className={`${styles.badge} ${styles.badgeLevel}`} 
              style={{ borderColor: `${cfg.color}4d`, color: cfg.color }}
              onClick={() => setShowCertificate(true)}
            >
              LVL {cfg.level} {profile?.title}
            </button>
          </div>
          <div className={styles.socialButtons}>
            {social.discord ? (
              <button className={`${styles.socialBtn} ${styles.socialConnected}`} onClick={() => disconnectSocial('discord')} disabled={disconnectingSocial === 'discord'}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                {disconnectingSocial === 'discord' ? '...' : `✓ ${social.discordUsername}`}
              </button>
            ) : (
              <button className={styles.socialBtn} onClick={connectDiscord}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Connect Discord
              </button>
            )}
            {social.twitter ? (
              <button className={`${styles.socialBtn} ${styles.socialConnected}`} onClick={() => disconnectSocial('twitter')} disabled={disconnectingSocial === 'twitter'}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                {disconnectingSocial === 'twitter' ? '...' : `✓ @${social.twitterUsername}`}
              </button>
            ) : (
              <button className={styles.socialBtn} onClick={connectTwitter}>
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Connect Twitter
              </button>
            )}
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
      <div className={styles.sectionLabel}>Collection</div>

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
      <div className={styles.sectionLabel}>My Ads</div>

      <div className={adStyles.adsSection}>
        <div className={adStyles.adsStats}>
          <span className={adStyles.active}>● {activeAds} Active</span>
          <span className={adStyles.expired}>● {expiredAds} Expired</span>
        </div>

        <button className={adStyles.createBtn} onClick={() => setShowAdForm(true)}>
          + CREATE AD
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
              {editingAdId === ad.id ? (
                <div className={adStyles.editWrap}>
                  <textarea
                    className={adStyles.textarea}
                    value={editMessage}
                    onChange={e => setEditMessage(e.target.value)}
                    maxLength={100}
                    placeholder="Edit your ad message..."
                  />
                  <div className={`${adStyles.charCount} ${editMessage.length > 80 ? adStyles.warning : ''} ${editMessage.length >= 100 ? adStyles.danger : ''}`}>
                    {editMessage.length}/100
                  </div>
                  <div className={adStyles.editActions}>
                    <button
                      className={adStyles.submitBtn}
                      onClick={() => handleEditAd(ad.id)}
                      disabled={adSubmitting || !editMessage.trim()}
                    >
                      {adSubmitting ? '⏳ SAVING...' : '✓ SAVE'}
                    </button>
                    <button className={adStyles.cancelBtn} onClick={cancelEditAd}>
                      CANCEL
                    </button>
                  </div>
                  {adError && <div className={adStyles.error}>{adError}</div>}
                </div>
              ) : (
                <>
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
                    <div className={adStyles.adActions}>
                      <button
                        className={adStyles.editBtn}
                        onClick={() => startEditAd(ad)}
                      >
                        ✎ EDIT
                      </button>
                      <button
                        className={`${adStyles.toggleBtn} ${ad.status === 'ACTIVE' ? adStyles.pause : adStyles.resume}`}
                        onClick={() => handleToggleAd(ad.id)}
                      >
                        {ad.status === 'ACTIVE' ? '⏸ PAUSE' : '▶ RESUME'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* NFT Modal */}
      <NFTModal 
        nft={selectedNFT}
        isOpen={showNFTModal}
        onClose={closeNFTModal}
      />

      {/* Certificate Modal */}
      <CertificateModal 
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
      />

      {/* PFP Selector Modal */}
      {showPfpSelector && (
        <div className={styles.pfpModal} onClick={() => setShowPfpSelector(false)}>
          <div className={styles.pfpModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.pfpModalHeader}>
              <h3>Select Profile Picture</h3>
              <button className={styles.pfpModalClose} onClick={() => setShowPfpSelector(false)}>✕</button>
            </div>
            <div className={styles.pfpModalGrid}>
              {nfts.map((nft) => {
                const isSelected = selectedPfp === nft.tokenId;
                const rc = getRarityColor(nft.rarity);
                return (
                  <div
                    key={nft.tokenId}
                    className={`${styles.pfpOption} ${isSelected ? styles.pfpSelected : ''}`}
                    onClick={() => handleSelectPfp(nft.tokenId)}
                    style={isSelected ? { borderColor: cfg.color, boxShadow: `0 0 16px ${cfg.color}66` } : {}}
                  >
                    {nft.metadata?.image ? (
                      <img src={nft.metadata.image} alt={nft.metadata?.name || `#${nft.tokenId}`} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', background: '#111' }}>
                        💀
                      </div>
                    )}
                    {isSelected && <div className={styles.pfpCheckmark}>✓</div>}
                    <div className={styles.pfpOptionInfo}>
                      <span className={styles.pfpOptionName}>{nft.metadata?.name || `#${nft.tokenId}`}</span>
                      <span className={styles.pfpOptionRarity} style={{ color: rc }}>{nft.rarity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
