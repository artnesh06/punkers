'use client';

import Link from 'next/link';
import styles from '@/styles/game.module.css';

interface GameOverBannerProps {
  isGameComplete: boolean;
}

export default function GameOverBanner({ isGameComplete }: Readonly<GameOverBannerProps>) {
  if (!isGameComplete) return null;

  return (
    <div className={styles.panel} style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div className={styles.panelTitle} style={{ fontSize: '28px', marginBottom: '16px' }}>
        💀 GAME OVER 💀
      </div>
      <p
        style={{
          fontSize: '16px',
          color: 'var(--dim)',
          marginBottom: '20px',
          letterSpacing: '1px',
        }}
      >
        The survival game has ended. Check out the winners!
      </p>
      <Link
        href="/winners"
        className={`${styles.btn} ${styles.br}`}
        style={{
          display: 'inline-block',
          textDecoration: 'none',
          padding: '10px 24px',
          fontSize: '18px',
          letterSpacing: '2px',
        }}
      >
        🏆 VIEW WINNERS
      </Link>
    </div>
  );
}
