import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: 'alive' | 'audited' | 'executed' | 'staked' | 'unstaked';
  size?: 'small' | 'medium' | 'large';
}

const STATUS_CONFIG = {
  alive: {
    icon: '✅',
    label: 'ALIVE',
    color: 'green',
  },
  audited: {
    icon: '🔍',
    label: 'AUDITED',
    color: 'orange',
  },
  executed: {
    icon: '💀',
    label: 'EXECUTED',
    color: 'red',
  },
  staked: {
    icon: '⚡',
    label: 'STAKED',
    color: 'green',
  },
  unstaked: {
    icon: '⏸️',
    label: 'UNSTAKED',
    color: 'gray',
  },
};

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.alive;

  return (
    <span className={`${styles.badge} ${styles[config.color]} ${styles[size]}`}>
      <span className={styles.icon}>{config.icon}</span>
      <span className={styles.label}>{config.label}</span>
    </span>
  );
}
