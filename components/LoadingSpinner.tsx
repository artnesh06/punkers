'use client';

import { useEffect, useState } from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const ANIMATIONS = ['spin', 'pulse', 'bounce', 'shake', 'glow', 'flip'];

export default function LoadingSpinner({ message = 'Loading...', size = 'medium' }: LoadingSpinnerProps) {
  const [animation, setAnimation] = useState('');

  useEffect(() => {
    const randomAnim = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
    setAnimation(randomAnim);
  }, []);

  const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : styles.medium;

  return (
    <div className={styles.container}>
      <div className={`${styles.spinner} ${styles[animation]} ${sizeClass}`}>💀</div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
