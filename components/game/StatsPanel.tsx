import styles from './StatsPanel.module.css';

interface StatsPanelProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'danger' | 'success';
}

export default function StatsPanel({
  label,
  value,
  variant = 'default',
}: StatsPanelProps) {
  const valueClass =
    variant !== 'default' ? `${styles.value} ${styles[variant]}` : styles.value;

  return (
    <div className={styles.panel}>
      <div className={styles.label}>{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}
