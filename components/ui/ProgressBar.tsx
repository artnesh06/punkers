import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'red' | 'green' | 'orange' | 'yellow';
  current?: number; // Legacy support
}

export default function ProgressBar({ 
  value, 
  max, 
  label,
  showPercentage = true,
  color = 'red',
  current // Legacy support
}: Readonly<ProgressBarProps>) {
  // Support both 'value' and 'current' for backwards compatibility
  const actualValue = current ?? value;
  const percentage = max > 0 ? Math.min((actualValue / max) * 100, 100) : 0;

  return (
    <div className={styles.container}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.bar}>
        <div 
          className={`${styles.fill} ${styles[color]}`} 
          style={{ width: `${percentage}%` }} 
        />
        {showPercentage && (
          <div className={styles.text}>
            {current === undefined ? `${Math.round(percentage)}%` : `${actualValue} / ${max}`}
          </div>
        )}
      </div>
    </div>
  );
}
