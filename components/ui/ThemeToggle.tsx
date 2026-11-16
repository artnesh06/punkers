'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`${styles.themeToggle} ${className || ''}`}
      onClick={toggleTheme}
      title="Toggle light/dark mode"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '🌙' : '🌑'}
    </button>
  );
}
