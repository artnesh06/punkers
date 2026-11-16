'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import WalletButton from '../wallet/WalletButton';
import { useToast } from '@/lib/hooks/useToast';
import CertificateModal from '../game/CertificateModal';
// import MusicPlayer from '../music/MusicPlayer';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { showToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [pfpImage, setPfpImage] = useState<string | null>(null);

  const navLinks = [
    { href: '/rules', label: 'Rules', id: 'rules', requiresWallet: false, disabled: false },
    { href: '/gallery', label: 'Gallery', id: 'gallery', requiresWallet: false, disabled: false },
    { href: '/stake', label: 'Stake', id: 'stake', requiresWallet: true, disabled: false },
    { href: '/survival', label: 'Survival', id: 'survival', requiresWallet: true, disabled: false },
    { href: '/graveyard', label: 'Graveyard', id: 'graveyard', requiresWallet: true, disabled: false },
    { href: '/ranks', label: 'Ranks', id: 'ranks', requiresWallet: true, disabled: false },
  ];

  const gameDropdownLinks = [
    { href: '/loot', label: 'Loot', id: 'loot', requiresWallet: false, disabled: true },
    { href: '/slot', label: 'Slot', id: 'slot', requiresWallet: false, disabled: true },
  ];

  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);

  const isGameActive = gameDropdownLinks.some((l) => pathname === l.href);

  const isActive = (href: string) => {
    return pathname === href;
  };

  const handleLockedClick = (e: React.MouseEvent, label: string, isDisabled: boolean) => {
    e.preventDefault();
    showToast({
      message: isDisabled ? `${label} — Coming soon` : `Connect wallet to access ${label}`,
      type: 'warning',
      duration: 3000,
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 5)}...${addr.slice(-3)}`;
  };

  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  // Load PFP — favoritePfpTokenId or first NFT (same as profile page)
  useEffect(() => {
    let cancelled = false;

    const loadPfp = async () => {
      if (!isConnected || !address) {
        setPfpImage(null);
        return;
      }

      // Check localStorage first for instant update
      const cachedImage = localStorage.getItem(`pfpImage_${address}`);
      if (cachedImage) {
        setPfpImage(cachedImage);
      }

      try {
        // Fetch favorite PFP token ID
        const pfpRes = await fetch(`/api/user/pfp?address=${address}`);
        const pfpData = await pfpRes.json();

        let tokenIdToUse = pfpData.tokenId || null;

        // If no favorite set, fall back to first NFT (like profile page)
        if (!tokenIdToUse) {
          const listRes = await fetch(`/api/nft/list?address=${address}`);
          if (listRes.ok) {
            const listData = await listRes.json();
            const firstNft = listData.nfts?.[0];
            if (firstNft?.metadata?.image) {
              if (!cancelled) {
                setPfpImage(firstNft.metadata.image);
                localStorage.setItem(`pfpImage_${address}`, firstNft.metadata.image);
              }
              return;
            }
            tokenIdToUse = firstNft?.tokenId || null;
          }
        }

        if (tokenIdToUse) {
          const nftRes = await fetch(`/api/nft/details?tokenId=${tokenIdToUse}`);
          const nftData = await nftRes.json();
          const img = nftData.nft?.metadata?.image;
          if (!cancelled) {
            if (img) {
              setPfpImage(img);
              localStorage.setItem(`pfpImage_${address}`, img);
            } else {
              setPfpImage(null);
            }
          }
        } else {
          if (!cancelled) {
            setPfpImage(null);
            localStorage.removeItem(`pfpImage_${address}`);
          }
        }
      } catch {
        // Keep cached image if available, otherwise null
      }
    };

    loadPfp();

    // Poll localStorage every 500ms for changes (e.g. from profile page)
    const pollInterval = setInterval(() => {
      if (isConnected && address) {
        const cachedImage = localStorage.getItem(`pfpImage_${address}`);
        if (cachedImage && cachedImage !== pfpImage) {
          setPfpImage(cachedImage);
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [isConnected, address, pfpImage]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mobileNav = document.getElementById('mobileNav');
      const hamburger = document.getElementById('hamburger');
      
      if (
        isMobileMenuOpen &&
        mobileNav &&
        hamburger &&
        !mobileNav.contains(target) &&
        !hamburger.contains(target)
      ) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.logo}>
          PUNKERS
        </Link>

        <div className={styles.navLinks}>
          {navLinks.filter(l => !l.hidden).map((link) => {
            const isLocked = link.disabled || (link.requiresWallet && !isConnected);
            
            if (isLocked) {
              return (
                <button
                  key={link.id}
                  type="button"
                  className={`${styles.navLink} ${styles.locked}`}
                  onClick={(e) => handleLockedClick(e, link.label, link.disabled)}
                  aria-label={`${link.label} - ${link.disabled ? 'Coming soon' : 'Wallet required'}`}
                >
                  {link.label}
                </button>
              );
            }

            return (
              <Link
                key={link.id}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Game Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
            <button
              type="button"
              className={`${styles.navLink} ${styles.locked}`}
              onClick={(e) => handleLockedClick(e, 'Game', true)}
              aria-label="Game — Coming soon"
            >
              Game ▾
            </button>
          </div>
        </div>

        <div className={styles.walletArea}>
          {/* Music Player — disabled for now */}
          {/* <MusicPlayer /> */}

          {/* Certificate Box */}
          <button
            className={styles.certificateBox}
            onClick={() => setIsCertificateOpen(true)}
            title="View Certificate"
            aria-label="View Certificate"
          >
            🏆
          </button>

          {/* PFP Box — links to profile */}
          {isConnected ? (
            <Link
              href="/profile"
              className={styles.pfpBox}
              title="View Profile"
              aria-label="View Profile"
            >
              <div className={styles.walletAvatar}>
                {pfpImage ? (
                  <img src={pfpImage} alt="PFP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '💀'
                )}
              </div>
            </Link>
          ) : (
            <div
              className={`${styles.pfpBox} ${styles.disabledBox}`}
              title="Connect wallet to view profile"
              aria-label="Profile — Wallet required"
            >
              <div className={styles.walletAvatar}>💀</div>
            </div>
          )}

          <WalletButton />
          
          <button
            id="hamburger"
            className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <div
        id="mobileNav"
        className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.open : ''}`}
      >
        <button
          className={styles.mobileNavClose}
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          ✕ close
        </button>

        {/* Home link in mobile */}
        <Link
          href="/"
          className={`${styles.mobileNavLink} ${isActive('/') ? styles.active : ''}`}
        >
          Home
        </Link>

        {navLinks.filter(l => !l.hidden).map((link) => {
          const isLocked = link.disabled || (link.requiresWallet && !isConnected);
          
          if (isLocked) {
            return (
              <button
                key={link.id}
                type="button"
                className={`${styles.mobileNavLink} ${styles.locked}`}
                onClick={(e) => {
                  handleLockedClick(e, link.label, link.disabled);
                  closeMobileMenu();
                }}
              >
                {link.label}
              </button>
            );
          }

          return (
            <Link
              key={link.id}
              href={link.href}
              className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
        
        {/* Game group in mobile menu */}
        <div className={styles.mobileNavGroup}>
          <div className={styles.mobileNavGroupLabel}>Game</div>
          {gameDropdownLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              className={`${styles.mobileNavLink} ${styles.indented} ${styles.locked}`}
              onClick={(e) => {
                handleLockedClick(e, link.label, true);
                closeMobileMenu();
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Mobile wallet section */}
        <div className={styles.mobileWalletSection}>
          {isConnected && address ? (
            <button
              className={styles.mobileWallet}
              onClick={() => {
                disconnect();
                closeMobileMenu();
              }}
              title="Click to disconnect"
            >
              <div className={styles.mobileWalletAvatar}>
                {pfpImage ? (
                  <img src={pfpImage} alt="PFP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Image
                    src="/images/face.png"
                    alt="Profile"
                    width={24}
                    height={24}
                    style={{ objectFit: 'contain' }}
                  />
                )}
              </div>
              <span className={styles.mobileWalletAddress}>{formatAddress(address)}</span>
            </button>
          ) : (
            <div className={styles.mobileWalletBtn}>
              <WalletButton />
            </div>
          )}
        </div>
      </div>

      {/* Certificate Modal */}
      <CertificateModal 
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
      />
    </>
  );
}
