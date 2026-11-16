'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { useToast } from '@/lib/hooks/useToast';
import styles from './CertificateModal.module.css';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CertLevel {
  lv: number;
  xp: number;
  border: string;
  glow: string;
  bar: string;
  corner: number;
  title: string;
  watermark: string;
  barBg: string;
}

const CERT_LEVELS: CertLevel[] = [
  { lv: 1, xp: 10, border: '#3a3a3a', glow: 'rgba(80,80,80,.25)', bar: 'linear-gradient(90deg,#444,#666)', corner: 10, title: 'ACTIVE PUNKER', watermark: '0.03', barBg: '#555' },
  { lv: 2, xp: 20, border: '#7a5c2e', glow: 'rgba(120,90,40,.35)', bar: 'linear-gradient(90deg,#7a5c2e,#c8922a)', corner: 14, title: 'BRONZE SURVIVOR', watermark: '0.04', barBg: '#c8922a' },
  { lv: 3, xp: 35, border: '#a0a0a0', glow: 'rgba(160,160,160,.4)', bar: 'linear-gradient(90deg,#707070,#d0d0d0)', corner: 18, title: 'SILVER WARRIOR', watermark: '0.05', barBg: '#bbb' },
  { lv: 4, xp: 55, border: '#c8a020', glow: 'rgba(200,160,30,.45)', bar: 'linear-gradient(90deg,#c8a020,#ffd040)', corner: 22, title: 'GOLD ELITE', watermark: '0.06', barBg: '#ffd040' },
  { lv: 5, xp: 80, border: '#00ccff', glow: 'rgba(0,200,255,.5)', bar: 'linear-gradient(90deg,#0088cc,#00ddff)', corner: 26, title: 'SAPPHIRE LEGEND', watermark: '0.07', barBg: '#00ccff' },
  { lv: 6, xp: 110, border: '#cc44ff', glow: 'rgba(180,60,255,.55)', bar: 'linear-gradient(90deg,#8822cc,#dd66ff)', corner: 30, title: 'AMETHYST CHAMPION', watermark: '0.08', barBg: '#cc44ff' },
  { lv: 7, xp: 150, border: '#00ff88', glow: 'rgba(0,255,120,.6)', bar: 'linear-gradient(90deg,#00aa55,#00ff99)', corner: 34, title: 'EMERALD OVERLORD', watermark: '0.09', barBg: '#00ff88' },
  { lv: 8, xp: 200, border: '#ff4444', glow: 'rgba(255,50,50,.65)', bar: 'linear-gradient(90deg,#cc2222,#ff6666)', corner: 38, title: 'CRIMSON DESTROYER', watermark: '0.10', barBg: '#ff4444' },
  { lv: 9, xp: 260, border: '#ff8800', glow: 'rgba(255,130,0,.7)', bar: 'linear-gradient(90deg,#cc6600,#ffaa22)', corner: 40, title: 'INFERNO WARLORD', watermark: '0.11', barBg: '#ff8800' },
  { lv: 10, xp: 999, border: '#ffffff', glow: 'rgba(255,255,255,.8)', bar: 'linear-gradient(90deg,#aaa,#fff,#aaa)', corner: 44, title: 'IMMORTAL PUNKER', watermark: '0.15', barBg: '#fff' },
];

export default function CertificateModal({ isOpen, onClose }: Readonly<CertificateModalProps>) {
  const { showToast } = useToast();
  const { isConnected, address } = useAccount();
  const [totalXp, setTotalXp] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [xpInLevel, setXpInLevel] = useState(0);
  const [xpForNextLevel, setXpForNextLevel] = useState(10);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [isTapped, setIsTapped] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const COOLDOWN_MS = 100; // 0.1 second cooldown (prevent double-click only)

  const formatAddress = (addr: string | undefined) => {
    if (!addr) return '0x000...000';
    return `${addr.slice(0, 5)}...${addr.slice(-3)}`;
  };

  const calculateLevel = (xp: number) => {
    let xpLeft = xp;
    for (let i = 0; i < CERT_LEVELS.length - 1; i++) {
      const needed = CERT_LEVELS[i].xp;
      if (xpLeft < needed) {
        setCurrentLevel(i);
        setXpInLevel(xpLeft);
        setXpForNextLevel(needed);
        return;
      }
      xpLeft -= needed;
    }
    const maxLvIdx = CERT_LEVELS.length - 1;
    const extraLevels = Math.floor(xpLeft / CERT_LEVELS[maxLvIdx].xp);
    const xpInLevel = xpLeft % CERT_LEVELS[maxLvIdx].xp;
    setCurrentLevel(maxLvIdx + extraLevels);
    setXpInLevel(xpInLevel);
    setXpForNextLevel(CERT_LEVELS[maxLvIdx].xp);
  };

  const getOrCreateSession = async (): Promise<string | null> => {
    if (!address) return null;

    // Check if we already have a valid session token in memory
    if (sessionToken && sessionExpiresAt) {
      const buffer = 5 * 60 * 1000; // 5 minutes buffer
      if (Date.now() < sessionExpiresAt - buffer) {
        return sessionToken;
      }
    }

    // Check localStorage for existing session
    const storedToken = localStorage.getItem(`punkers-session-${address}`);
    const storedExpiry = localStorage.getItem(`punkers-session-expiry-${address}`);
    
    if (storedToken && storedExpiry) {
      const expiryTime = Number.parseInt(storedExpiry);
      const buffer = 5 * 60 * 1000; // 5 minutes buffer
      
      if (Date.now() < expiryTime - buffer) {
        // Session still valid, use it
        setSessionToken(storedToken);
        setSessionExpiresAt(expiryTime);
        return storedToken;
      }
    }

    try {
      // Request signature from user (only once per 24 hours)
      const timestamp = Date.now();
      const message = `Sign this message to start your certificate session.\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nThis signature will not trigger any blockchain transaction or cost any gas fees.\n\nSession valid for 24 hours.`;
      
      const signature = await (globalThis as any).ethereum?.request({
        method: 'personal_sign',
        params: [message, address],
      });

      if (!signature) {
        console.error('No signature received');
        return null;
      }

      // Exchange signature for session token
      const response = await fetch('/api/certificate/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address, 
          signature,
          timestamp,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create session:', error);
        showToast({
          message: error.error || 'Failed to create session',
          type: 'error',
          duration: 3000,
        });
        return null;
      }

      const result = await response.json();
      
      // Store session token in memory AND localStorage
      setSessionToken(result.sessionToken);
      setSessionExpiresAt(result.expiresAt);
      localStorage.setItem(`punkers-session-${address}`, result.sessionToken);
      localStorage.setItem(`punkers-session-expiry-${address}`, result.expiresAt.toString());

      return result.sessionToken;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const syncToDatabase = async (xp: number) => {
    if (!address) return;

    try {
      const token = await getOrCreateSession();
      if (!token) return;

      // Generate unique nonce for this request
      const nonce = crypto.randomUUID();

      const response = await fetch('/api/certificate/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionToken: token,
          totalXp: xp,
          nonce,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to sync:', error);
      }
    } catch (error) {
      console.error('Error syncing to database:', error);
    }
  };

  const loadCertificateFromDatabase = async () => {
    if (!address) return;

    try {
      const response = await fetch(`/api/certificate/sync?address=${address}`);
      const result = await response.json();

      if (result.success && result.data) {
        // Database exists - ALWAYS use database as source of truth
        const dbXp = result.data.totalXp;
        
        setTotalXp(dbXp);
        calculateLevel(dbXp);
        localStorage.setItem('punkers-cert-xp', dbXp.toString());
        
        console.log(`Certificate loaded from DB: ${dbXp} XP`);
      } else {
        // No data in DB - use localStorage and sync to DB if exists
        const localXp = Number.parseInt(localStorage.getItem('punkers-cert-xp') || '0');
        
        setTotalXp(localXp);
        calculateLevel(localXp);
        
        if (localXp > 0) {
          console.log(`Syncing localStorage (${localXp} XP) to database...`);
          await syncToDatabase(localXp);
        }
      }
    } catch (error) {
      console.error('Error loading certificate:', error);
      // Fallback to localStorage on error
      const savedXp = Number.parseInt(localStorage.getItem('punkers-cert-xp') || '0');
      setTotalXp(savedXp);
      calculateLevel(savedXp);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      // Load session from localStorage if exists
      const storedToken = localStorage.getItem(`punkers-session-${address}`);
      const storedExpiry = localStorage.getItem(`punkers-session-expiry-${address}`);
      
      if (storedToken && storedExpiry) {
        const expiryTime = Number.parseInt(storedExpiry);
        if (Date.now() < expiryTime) {
          setSessionToken(storedToken);
          setSessionExpiresAt(expiryTime);
        }
      }
      
      loadCertificateFromDatabase();
    } else {
      const savedXp = Number.parseInt(localStorage.getItem('punkers-cert-xp') || '0');
      setTotalXp(savedXp);
      calculateLevel(savedXp);
    }
  }, [isConnected, address]);

  const getCurrentLevelConfig = () => {
    if (currentLevel < CERT_LEVELS.length) {
      return CERT_LEVELS[currentLevel];
    }
    const base = CERT_LEVELS.at(-1)!;
    return { ...base, title: `IMMORTAL LVL ${currentLevel + 1}` };
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isConnected || !address) {
      showToast({
        message: 'Connect wallet to level up certificate',
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    if (timeSinceLastTap < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastTap) / 1000);
      showToast({
        message: `Please wait ${waitSeconds} second${waitSeconds > 1 ? 's' : ''} between taps`,
        type: 'warning',
        duration: 2000,
      });
      return;
    }

    setLastTapTime(now);
    
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 460);

    const curLvIdx = currentLevel;
    const color = getCurrentLevelConfig().border;

    drawLightning(color);
    spawnSparks(color);

    // Optimistic update for smooth UX
    let newTotalXp = totalXp + 1;
    setTotalXp(newTotalXp);
    localStorage.setItem('punkers-cert-xp', newTotalXp.toString());

    // Calculate level immediately for UI
    let xpLeft = newTotalXp;
    let newLevel = 0;
    let newXpInLevel = 0;
    let newXpForNext = 10;
    let foundLevel = false;
    
    for (let i = 0; i < CERT_LEVELS.length - 1; i++) {
      const needed = CERT_LEVELS[i].xp;
      if (xpLeft < needed) {
        newLevel = i;
        newXpInLevel = xpLeft;
        newXpForNext = needed;
        foundLevel = true;
        break;
      }
      xpLeft -= needed;
    }
    
    if (!foundLevel) {
      const maxLvIdx = CERT_LEVELS.length - 1;
      const extraLevels = Math.floor(xpLeft / CERT_LEVELS[maxLvIdx].xp);
      newLevel = maxLvIdx + extraLevels;
      newXpInLevel = xpLeft % CERT_LEVELS[maxLvIdx].xp;
      newXpForNext = CERT_LEVELS[maxLvIdx].xp;
    }

    setCurrentLevel(newLevel);
    setXpInLevel(newXpInLevel);
    setXpForNextLevel(newXpForNext);

    const afterLv = newLevel + 1;
    if (afterLv > curLvIdx + 1) {
      setIsLevelingUp(true);
      setTimeout(() => setIsLevelingUp(false), 900);
      spawnParticles();
      showToast({
        message: `⚡ Certificate leveled up to LVL ${afterLv}!`,
        type: 'success',
        duration: 3000,
      });
    }

    // Save to database in background
    try {
      const token = await getOrCreateSession();
      if (token) {
        const nonce = crypto.randomUUID();

        const response = await fetch('/api/certificate/sync', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sessionToken: token,
            nonce,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const dbXp = result.data.totalXp;
            
            // Sync correction if database differs
            if (dbXp !== newTotalXp) {
              console.log(`XP corrected: Local=${newTotalXp}, DB=${dbXp}`);
              setTotalXp(dbXp);
              calculateLevel(dbXp);
              localStorage.setItem('punkers-cert-xp', dbXp.toString());
            }
          }
        } else {
          const error = await response.json();
          if (response.status === 429) {
            showToast({
              message: error.error || 'Too many taps. Please slow down.',
              type: 'warning',
              duration: 3000,
            });
          } else if (response.status === 401) {
            // Session expired, clear it from memory and localStorage
            setSessionToken(null);
            setSessionExpiresAt(null);
            if (address) {
              localStorage.removeItem(`punkers-session-${address}`);
              localStorage.removeItem(`punkers-session-expiry-${address}`);
            }
            showToast({
              message: 'Session expired. Please tap again to sign.',
              type: 'warning',
              duration: 3000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error saving XP to database:', error);
    }
  };

  const drawLightning = (color: string) => {
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!canvas || !card) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = card.offsetWidth + 40;
    const h = card.offsetHeight + 40;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    const numArcs = 2 + Math.floor(Math.random() * 3);
    for (let a = 0; a < numArcs; a++) {
      const side = Math.floor(Math.random() * 4);
      let x1, y1;
      const pad = 20;
      
      if (side === 0) {
        x1 = pad + Math.random() * (w - 2 * pad);
        y1 = pad;
      } else if (side === 1) {
        x1 = w - pad;
        y1 = pad + Math.random() * (h - 2 * pad);
      } else if (side === 2) {
        x1 = pad + Math.random() * (w - 2 * pad);
        y1 = h - pad;
      } else {
        x1 = pad;
        y1 = pad + Math.random() * (h - 2 * pad);
      }
      
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 100;
      const x2 = Math.max(pad, Math.min(w - pad, x1 + Math.cos(angle) * dist));
      const y2 = Math.max(pad, Math.min(h - pad, y1 + Math.sin(angle) * dist));
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      
      const steps = 6 + Math.floor(Math.random() * 6);
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        ctx.lineTo(
          x1 + (x2 - x1) * t + (Math.random() - 0.5) * 28,
          y1 + (y2 - y1) * t + (Math.random() - 0.5) * 28
        );
      }
      ctx.lineTo(x2, y2);
      
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
      ctx.strokeStyle = color + 'aa';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      
      ctx.shadowBlur = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    setTimeout(() => {
      ctx.clearRect(0, 0, w, h);
    }, 250);
  };

  const spawnParticles = () => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const emojis = ['⚡', '💥', '✨', '🔥', '💀', '★', '◆'];
    
    for (let i = 0; i < 18; i++) {
      const particle = document.createElement('div');
      particle.className = styles.certParticle;
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.5;
      const distance = 80 + Math.random() * 120;
      const px = Math.cos(angle) * distance;
      const py = Math.sin(angle) * distance;
      
      particle.style.left = `${cx}px`;
      particle.style.top = `${cy}px`;
      particle.style.setProperty('--px', `${px}px`);
      particle.style.setProperty('--py', `${py}px`);
      particle.style.animationDelay = `${Math.random() * 0.15}s`;
      
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  };

  const spawnSparks = (color: string) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const count = 6 + Math.floor(Math.random() * 8);
    
    for (let i = 0; i < count; i++) {
      const side = Math.floor(Math.random() * 4);
      let x, y;
      
      if (side === 0) {
        x = rect.left + Math.random() * rect.width;
        y = rect.top;
      } else if (side === 1) {
        x = rect.right;
        y = rect.top + Math.random() * rect.height;
      } else if (side === 2) {
        x = rect.left + Math.random() * rect.width;
        y = rect.bottom;
      } else {
        x = rect.left;
        y = rect.top + Math.random() * rect.height;
      }
      
      const spark = document.createElement('div');
      spark.className = styles.certSpark;
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.setProperty('--spark-color', color);
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 50;
      const sx = Math.cos(angle) * distance;
      const sy = Math.sin(angle) * distance;
      
      spark.style.setProperty('--sx', `${sx}px`);
      spark.style.setProperty('--sy', `${sy}px`);
      spark.style.animationDelay = `${Math.random() * 0.1}s`;
      
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 600);
    }
  };

  const handleOverlayClick = () => {
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const config = getCurrentLevelConfig();
  const xpPercentage = (xpInLevel / xpForNextLevel) * 100;

  return (
    <div 
      className={`${styles.certOverlay} ${isOpen ? styles.open : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={cardRef}
        className={`${styles.certCard} ${isTapped ? styles.tapped : ''}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick(e as unknown as React.MouseEvent);
          }
        }}
        style={{
          '--cert-border-color': config.border,
          '--cert-glow-color': config.glow,
          '--cert-corner-size': `${config.corner}px`,
          borderColor: config.border,
          boxShadow: `0 0 40px ${config.glow}, 0 0 80px ${config.glow.replace(/[\d.]+\)$/, '0.08)')}`,
        } as React.CSSProperties}
      >
        <div className={styles.certGlitchR}></div>
        <div className={styles.certGlitchB}></div>

        <canvas 
          ref={canvasRef}
          className={styles.certLightningCanvas}
          width={460}
          height={700}
        />

        <svg className={`${styles.certLightningStrike} ${isLevelingUp ? styles.striking : ''}`} width="60" height="80" viewBox="0 0 60 80">
          <polyline points="30,0 18,35 28,35 14,80" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="30,0 18,35 28,35 14,80" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.25"/>
        </svg>

        <div 
          className={styles.certTopBar}
          style={{ background: config.bar }}
        ></div>
        <div className={`${styles.certCorner} ${styles.tl}`}></div>
        <div className={`${styles.certCorner} ${styles.tr}`}></div>
        <div className={`${styles.certCorner} ${styles.bl}`}></div>
        <div className={`${styles.certCorner} ${styles.br}`}></div>
        <div 
          className={styles.certScan}
          style={{ 
            background: `linear-gradient(180deg, transparent, ${config.border}08, transparent)` 
          }}
        ></div>

        <div className={`${styles.certLevelUpPopup} ${isLevelingUp ? styles.flash : ''}`}>
          <div className={styles.lvlupText}>LEVEL UP!</div>
          <div className={styles.lvlupSub}>LVL {currentLevel + 1}</div>
        </div>

        <div className={styles.certHeader}>
          <div 
            className={styles.certTitle}
            style={{ color: config.border }}
          >
            SURVIVOR CERTIFICATE
          </div>
          <div className={styles.certDivider}></div>
          <div className={styles.certLevelBadgeWrap}>
            <span 
              className={styles.certLevelBadge}
              style={{ 
                borderColor: config.border,
                color: config.border 
              }}
            >
              ⚡ LVL {currentLevel + 1}
            </span>
          </div>
        </div>

        <div className={styles.certAvatarWrap}>
          <div className={styles.certAvatar}>
            <Image 
              src="/images/face.png" 
              alt="Avatar" 
              width={80} 
              height={80}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div 
              className={styles.certAvatarRing}
              style={{ borderColor: config.border + '55' }}
            ></div>
          </div>
        </div>

        <div className={styles.certNameSection}>
          <div 
            className={styles.certAddr}
            style={{ color: config.border }}
          >
            {formatAddress(address)}
          </div>
          <div 
            className={styles.certRankName}
            style={{ 
              borderColor: config.border,
              color: config.border 
            }}
          >
            {config.title}
          </div>
          <div 
            className={styles.certRankTitle}
            style={{ color: config.border + 'bb' }}
          >
            IS HEREBY RECOGNIZED AS AN {config.title}
          </div>
        </div>

        <div className={styles.certStatsGrid}>
          <div className={styles.certStatItem}>
            <div 
              className={styles.certStatLabel}
              style={{ color: config.border + '77' }}
            >
              PUNKERS
            </div>
            <div 
              className={styles.certStatVal}
              style={{ color: config.border }}
            >
              0
            </div>
          </div>
          <div className={styles.certStatItem}>
            <div 
              className={styles.certStatLabel}
              style={{ color: config.border + '77' }}
            >
              POINTS
            </div>
            <div 
              className={styles.certStatVal}
              style={{ color: config.border }}
            >
              0
            </div>
          </div>
          <div className={styles.certStatItem}>
            <div 
              className={styles.certStatLabel}
              style={{ color: config.border + '77' }}
            >
              KILLS
            </div>
            <div 
              className={styles.certStatVal}
              style={{ color: config.border }}
            >
              0
            </div>
          </div>
          <div className={styles.certStatItem}>
            <div 
              className={styles.certStatLabel}
              style={{ color: config.border + '77' }}
            >
              $PUNK
            </div>
            <div 
              className={styles.certStatVal}
              style={{ color: config.border }}
            >
              0
            </div>
          </div>
          <div className={styles.certStatItem}>
            <div 
              className={styles.certStatLabel}
              style={{ color: config.border + '77' }}
            >
              TAX PAID
            </div>
            <div 
              className={styles.certStatVal}
              style={{ color: config.border }}
            >
              0
            </div>
          </div>
          <div className={styles.certStatItem}>
            <div 
              className={styles.certStatLabel}
              style={{ color: config.border + '77' }}
            >
              STATUS
            </div>
            <div 
              className={styles.certStatVal}
              style={{ 
                color: config.border,
                fontSize: '11px'
              }}
            >
              N/A
            </div>
          </div>
        </div>

        <div className={styles.certFooter}>
          <div 
            className={styles.certFooterText}
            style={{ color: config.border + '99' }}
          >
            ISSUED: DAY 0 · SEASON 1
          </div>
          <div 
            className={styles.certFooterText}
            style={{ color: config.border + '99' }}
          >
            PUNKERS.GG
          </div>
        </div>

        <div className={styles.certXpSection}>
          <div className={styles.certXpWrap}>
            <div 
              className={styles.certXpBar}
              style={{ 
                width: `${xpPercentage}%`,
                background: config.barBg 
              }}
            ></div>
          </div>
          <div className={styles.certXpLabels}>
            <span style={{ color: config.border }}>
              {xpInLevel} / {xpForNextLevel} XP
            </span>
            <span style={{ color: config.border }}>
              TOTAL: {totalXp} XP
            </span>
          </div>
        </div>

        <div 
          className={styles.certTapHint}
          style={{ color: config.border + '44' }}
        >
          TAP TO LEVEL UP · CLICK OUTSIDE TO CLOSE
        </div>
      </div>
    </div>
  );
}
