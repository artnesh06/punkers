'use client';

import { useEffect } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Toast({
  message,
  type,
  duration = 3000,
  onClose,
  action,
}: Readonly<ToastProps>) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClass = {
    success: styles.success,
    error: styles.error,
    info: styles.info,
    warning: styles.warning,
  }[type];

  const handleActionClick = () => {
    if (action?.onClick) {
      action.onClick();
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <div className={`${styles.toast} ${typeClass}`}>
      <span className={styles.message}>{message}</span>
      {action && (
        <button 
          className={styles.actionButton} 
          onClick={handleActionClick}
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Toast container component for managing multiple toasts
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
          action={toast.action}
        />
      ))}
    </div>
  );
}

