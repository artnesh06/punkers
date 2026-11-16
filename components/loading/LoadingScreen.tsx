'use client';

import { useState, useEffect } from 'react';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  message?: string;
}

const LOADING_TYPES = [
  'spinning-skull',
  'glitch-text',
  'dots-pulse',
  'scanline-sweep',
  'pixel-spinner',
  'bouncing-emoji',
  'progress-bar',
] as const;

type LoadingType = typeof LOADING_TYPES[number];

export default function LoadingScreen({ message = 'LOADING' }: LoadingScreenProps) {
  const [loadingType, setLoadingType] = useState<LoadingType>('spinning-skull');

  useEffect(() => {
    // Random pick loading animation on mount
    const randomType = LOADING_TYPES[Math.floor(Math.random() * LOADING_TYPES.length)];
    setLoadingType(randomType);
  }, []);

  return (
    <div className={styles.loadingScreen}>
      {/* 1. Spinning Skull */}
      {loadingType === 'spinning-skull' && (
        <div className={styles.spinningSkull}>
          <div className={styles.skull}>💀</div>
          <div className={styles.text}>{message}</div>
        </div>
      )}

      {/* 2. Glitch Text */}
      {loadingType === 'glitch-text' && (
        <div className={styles.glitchContainer}>
          <div className={styles.glitchText} data-text={message}>
            {message}
          </div>
          <div className={styles.glitchSubtext}>PLEASE WAIT...</div>
        </div>
      )}

      {/* 3. Dots Pulse */}
      {loadingType === 'dots-pulse' && (
        <div className={styles.dotsPulse}>
          <div className={styles.emoji}>💀</div>
          <div className={styles.dotsText}>
            {message}
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
          </div>
        </div>
      )}

      {/* 4. Scanline Sweep */}
      {loadingType === 'scanline-sweep' && (
        <div className={styles.scanlineSweep}>
          <div className={styles.scanlineBar} />
          <div className={styles.text}>{message}</div>
        </div>
      )}

      {/* 5. Pixel Spinner */}
      {loadingType === 'pixel-spinner' && (
        <div className={styles.pixelSpinner}>
          <div className={styles.spinner}>
            <div className={styles.pixel}></div>
            <div className={styles.pixel}></div>
            <div className={styles.pixel}></div>
            <div className={styles.pixel}></div>
          </div>
          <div className={styles.text}>{message}</div>
        </div>
      )}

      {/* 6. Bouncing Emoji */}
      {loadingType === 'bouncing-emoji' && (
        <div className={styles.bouncingEmoji}>
          <div className={styles.emojiGroup}>
            <span className={styles.emoji1}>💀</span>
            <span className={styles.emoji2}>⚡</span>
            <span className={styles.emoji3}>🔥</span>
          </div>
          <div className={styles.text}>{message}</div>
        </div>
      )}

      {/* 7. Progress Bar */}
      {loadingType === 'progress-bar' && (
        <div className={styles.progressBar}>
          <div className={styles.text}>{message}</div>
          <div className={styles.barContainer}>
            <div className={styles.bar} />
          </div>
          <div className={styles.percentage}>
            <span className={styles.digit}>0</span>
            <span className={styles.digit}>0</span>
            <span className={styles.digit}>0</span>%
          </div>
        </div>
      )}
    </div>
  );
}
