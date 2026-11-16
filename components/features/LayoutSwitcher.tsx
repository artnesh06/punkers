'use client';

import type { JSX } from 'react';
import styles from './LayoutSwitcher.module.css';

export type LayoutOption = 'grid3' | 'grid2' | 'grid4' | 'list' | 'list-detail';

interface LayoutSwitcherProps {
  readonly activeLayout: LayoutOption;
  readonly onLayoutChange: (layout: LayoutOption) => void;
  readonly className?: string;
}

export default function LayoutSwitcher({
  activeLayout,
  onLayoutChange,
  className = '',
}: LayoutSwitcherProps) {
  const layouts: Array<{ value: LayoutOption; title: string; icon: JSX.Element }> = [
    {
      value: 'grid3',
      title: 'Grid 3',
      icon: (
        <svg viewBox="0 0 16 16">
          <rect x="1" y="1" width="4" height="4" />
          <rect x="6" y="1" width="4" height="4" />
          <rect x="11" y="1" width="4" height="4" />
          <rect x="1" y="6" width="4" height="4" />
          <rect x="6" y="6" width="4" height="4" />
          <rect x="11" y="6" width="4" height="4" />
          <rect x="1" y="11" width="4" height="4" />
          <rect x="6" y="11" width="4" height="4" />
          <rect x="11" y="11" width="4" height="4" />
        </svg>
      ),
    },
    {
      value: 'grid2',
      title: 'Grid 2',
      icon: (
        <svg viewBox="0 0 16 16">
          <rect x="1" y="1" width="6" height="6" />
          <rect x="9" y="1" width="6" height="6" />
          <rect x="1" y="9" width="6" height="6" />
          <rect x="9" y="9" width="6" height="6" />
        </svg>
      ),
    },
    {
      value: 'grid4',
      title: 'Grid 4',
      icon: (
        <svg viewBox="0 0 16 16">
          <rect x="1" y="1" width="3" height="5" />
          <rect x="5" y="1" width="3" height="5" />
          <rect x="9" y="1" width="3" height="5" />
          <rect x="13" y="1" width="3" height="5" />
          <rect x="1" y="8" width="3" height="5" />
          <rect x="5" y="8" width="3" height="5" />
          <rect x="9" y="8" width="3" height="5" />
          <rect x="13" y="8" width="3" height="5" />
        </svg>
      ),
    },
    {
      value: 'list',
      title: 'List',
      icon: (
        <svg viewBox="0 0 16 16">
          <rect x="5" y="2" width="10" height="2" />
          <rect x="1" y="2" width="3" height="2" />
          <rect x="5" y="7" width="10" height="2" />
          <rect x="1" y="7" width="3" height="2" />
          <rect x="5" y="12" width="10" height="2" />
          <rect x="1" y="12" width="3" height="2" />
        </svg>
      ),
    },
    {
      value: 'list-detail',
      title: 'List Detail',
      icon: (
        <svg viewBox="0 0 16 16">
          <rect x="1" y="1" width="14" height="4" />
          <rect x="1" y="6" width="14" height="4" />
          <rect x="1" y="11" width="14" height="4" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`${styles.layoutBar} ${className}`}>
      <div className={styles.layoutButtons}>
        {layouts.map((layout) => (
          <button
            key={layout.value}
            className={`${styles.layoutButton} ${
              activeLayout === layout.value ? styles.active : ''
            }`}
            onClick={() => onLayoutChange(layout.value)}
            title={layout.title}
            type="button"
            aria-label={layout.title}
          >
            {layout.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
