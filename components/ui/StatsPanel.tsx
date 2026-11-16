import styles from './StatsPanel.module.css';

export interface StatItem {
  label: string;
  value: string | number;
  color?: 'green' | 'red' | 'yellow' | 'white';
  live?: boolean;
}

export interface StatsPanelProps {
  readonly stats: StatItem[];
  readonly columns?: 2 | 3 | 4;
  readonly className?: string;
}

export default function StatsPanel({
  stats,
  columns = 4,
  className = '',
}: StatsPanelProps) {
  const colsClass = styles[`cols${columns}`];
  const gridClassName = `${styles.statsGrid} ${colsClass} ${className}`;

  return (
    <div className={gridClassName}>
      {stats.map((stat, index) => {
        const valueColorClass = stat.color ? styles[stat.color] : '';
        const valueClassName = `${styles.value} ${valueColorClass}`;

        return (
          <div key={`${stat.label}-${index}`} className={styles.statCard}>
            <div className={styles.label}>{stat.label}</div>
            <div className={valueClassName}>
              {stat.value}
              {stat.live && <span className={styles.liveDot}></span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
