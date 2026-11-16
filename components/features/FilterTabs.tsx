'use client';

import styles from './FilterTabs.module.css';

export type FilterOption = {
  value: string;
  label: string;
};

interface FilterTabsProps {
  readonly options: FilterOption[];
  readonly activeFilter: string;
  readonly onFilterChange: (filter: string) => void;
  readonly className?: string;
}

export default function FilterTabs({
  options,
  activeFilter,
  onFilterChange,
  className = '',
}: FilterTabsProps) {
  return (
    <div className={`${styles.filterTabs} ${className}`}>
      {options.map((option, index) => (
        <button
          key={option.value}
          className={`${styles.filterTab} ${
            activeFilter === option.value ? styles.active : ''
          }`}
          onClick={() => onFilterChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
