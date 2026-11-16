'use client';

import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerNoise} />
      
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          
          {/* Brand */}
          <div>
            <span className={styles.footerBrandLogo}>PUNKERS</span>
            <p className={styles.footerBrandTagline}>
              The most brutal NFT survival game on Web3. Stake, fight, and survive — or get eliminated.
            </p>
            <div className={styles.footerStatus}>
              <span className={styles.footerStatusDot}></span>
              {' '}ALL SYSTEMS OPERATIONAL
            </div>
          </div>
          
          {/* Features */}
          <div>
            <p className={styles.footerColTitle}>Features</p>
            <ul className={styles.footerLinks}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/gallery">Gallery</Link></li>
              <li><Link href="/stake">Staking</Link></li>
              <li><Link href="/survival">Survival</Link></li>
              <li><Link href="/graveyard">Graveyard</Link></li>
              <li><Link href="/ranks">Ranks</Link></li>
            </ul>
          </div>
          
          {/* Community */}
          <div>
            <p className={styles.footerColTitle}>Community</p>
            <ul className={styles.footerLinks}>
              <li><a href="https://x.com/i/chat/group_join/g2031559215614144964/g6sO5BlP3M" target="_blank" rel="noopener noreferrer">X Group Chat</a></li>
              <li><a href="https://x.com/artnesh" target="_blank" rel="noopener noreferrer">Twitter / X</a></li>
              <li><span className={styles.disabledLink}>Brand Kit</span></li>
              <li><Link href="/rules">Rules</Link></li>
            </ul>
          </div>
          
          {/* Live Stats */}
          <div>
            <p className={styles.footerColTitle}>Live Stats</p>
            <ul className={styles.footerLinks}>
              <li>
                <span className={styles.liveStatRow}>
                  <span>Total Punkers</span>
                  <span className={styles.statGreen}>0</span>
                </span>
              </li>
              <li>
                <span className={styles.liveStatRow}>
                  <span>$PUNK Supply</span>
                  <span className={styles.statYellow}>0</span>
                </span>
              </li>
              <li>
                <span className={styles.liveStatRow}>
                  <span>NFT Holders</span>
                  <span className={styles.statGreen}>0</span>
                </span>
              </li>
              <li>
                <span className={styles.liveStatRow}>
                  <span>Floor Price</span>
                  <span className={styles.statRed}>0 ETH</span>
                </span>
              </li>
            </ul>
          </div>
          
        </div>
      </div>
        
      {/* Bottom Bar */}
      <div className={styles.footerBottom}>
        <span className={styles.footerCopy}>
          PUNKERS © 2026 — All Rights Reserved
        </span>
        
        <div className={styles.footerBottomLinks}>
          <span className={styles.footerBottomDisabled}>Privacy Policy</span>
          <span className={styles.footerBottomDisabled}>Terms of Service</span>
          <span className={styles.footerBottomDisabled}>Cookie Policy</span>
        </div>
      </div>
    </footer>
  );
}
