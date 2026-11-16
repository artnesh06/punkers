'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './Ticker.module.css';
import AdModal from './AdModal';
import LinkifyText from './LinkifyText';

interface AdItem {
  message: string;
  by: string;
  date: string;
  slot: string;
  duration: string;
  status: string;
}

export default function Ticker() {
  const [adItems, setAdItems] = useState<AdItem[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickerContent();
    // Refresh every 60 seconds to pick up new/expired ads
    const interval = setInterval(loadTickerContent, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadTickerContent = async () => {
    try {
      const response = await fetch('/api/ads/active', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.ads && data.ads.length > 0) {
          const items: AdItem[] = data.ads.map((ad: any) => ({
            message: ad.message,
            by: ad.by || 'Anonymous',
            date: ad.date || '',
            slot: ad.id,
            duration: ad.duration || (ad.remainingMs ? `${Math.ceil(ad.remainingMs / 3600000)}h` : ''),
            status: ad.status,
          }));
          setAdItems(items);
        } else {
          setAdItems([]);
        }
      } else {
        setAdItems([]);
      }
    } catch (error) {
      console.warn('Failed to load ticker content:', error);
      setAdItems([]);
    }
  };

  const handleAdClick = (e: React.MouseEvent, ad: AdItem) => {
    // Don't open ad modal if user clicked a link inside the message
    const target = e.target as HTMLElement;
    if (target.closest('button[title]')) return;
    setSelectedAd(ad);
    setIsPaused(true);
  };

  const handleCloseModal = () => {
    setSelectedAd(null);
    setIsPaused(false);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (!selectedAd) {
      setIsPaused(false);
    }
  };

  return (
    <>
      <div 
        className={styles.adBanner}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="banner"
        aria-label="Advertisement banner"
      >
        {adItems.length === 0 ? (
          // No ads - show static centered text
          <div className={styles.adStatic}>
            [ YOUR AD HERE ] • $PUNK ONLY • 24H
          </div>
        ) : (
          // Has ads - show marquee
          <div className={styles.adTickerWrap}>
            <div 
              ref={tickerRef}
              className={`${styles.adTicker} ${isPaused ? styles.paused : ''}`}
              role="marquee"
              aria-live="off"
            >
              {/* Triplicate items for seamless loop without text cutoff */}
              {[...adItems, ...adItems, ...adItems].map((ad, index) => (
                <span
                  key={`${ad.slot}-${index}`}
                  className={styles.adItem}
                  onClick={(e) => handleAdClick(e, ad)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const target = e.target as HTMLElement;
                      if (!target.closest('button[title]')) {
                        setSelectedAd(ad);
                        setIsPaused(true);
                      }
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ad: ${ad.message}`}
                >
                  | <LinkifyText text={ad.message} /> {ad.by ? `• ${ad.by}` : ''} |
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <AdModal
        isOpen={!!selectedAd}
        onClose={handleCloseModal}
        ad={selectedAd}
      />
    </>
  );
}
