'use client';

import { useState, useEffect } from 'react';
import styles from './ScrollToTop.module.css';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 300);
    }

    // Listen for music panel open/close via custom event
    function handleMusicToggle(e: Event) {
      setMusicOpen((e as CustomEvent).detail?.open ?? false);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('punkers-music-toggle', handleMusicToggle);

    // Check initial scroll position
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('punkers-music-toggle', handleMusicToggle);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      className={`${styles.btn} ${musicOpen ? styles.withMusic : styles.default}`}
      onClick={scrollToTop}
      title="Back to top"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}
