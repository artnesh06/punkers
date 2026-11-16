'use client';

import { useToast } from '@/lib/hooks/useToast';
import { ToastContainer } from './Toast';

/**
 * Toast Component Example
 * 
 * Demonstrates the usage of the Toast notification system with:
 * - Different type variants (info, success, warning, error)
 * - Optional action buttons
 * - Auto-dismiss functionality
 */
export default function ToastExample() {
  const { showToast } = useToast();

  const handleShowInfo = () => {
    showToast({
      message: 'ℹ️ This is an info message',
      type: 'info',
      duration: 3000,
    });
  };

  const handleShowSuccess = () => {
    showToast({
      message: '✅ Wallet connected successfully',
      type: 'success',
      duration: 3000,
    });
  };

  const handleShowWarning = () => {
    showToast({
      message: '⚠️ Please connect your wallet',
      type: 'warning',
      duration: 3000,
    });
  };

  const handleShowError = () => {
    showToast({
      message: '❌ Transaction failed',
      type: 'error',
      duration: 3000,
    });
  };

  const handleShowWithAction = () => {
    showToast({
      message: '🗑️ Item deleted',
      type: 'success',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          console.log('Undo action clicked');
          showToast({
            message: '↩️ Action undone',
            type: 'info',
            duration: 2000,
          });
        },
      },
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'var(--font-mono)' }}>
      <h2>Toast Notification Examples</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
        <button
          onClick={handleShowInfo}
          style={{
            padding: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          Show Info Toast
        </button>

        <button
          onClick={handleShowSuccess}
          style={{
            padding: '10px',
            border: '1px solid var(--accent-green)',
            background: 'var(--bg-card)',
            color: 'var(--accent-green)',
            cursor: 'pointer',
          }}
        >
          Show Success Toast
        </button>

        <button
          onClick={handleShowWarning}
          style={{
            padding: '10px',
            border: '1px solid var(--accent-orange)',
            background: 'var(--bg-card)',
            color: 'var(--accent-orange)',
            cursor: 'pointer',
          }}
        >
          Show Warning Toast
        </button>

        <button
          onClick={handleShowError}
          style={{
            padding: '10px',
            border: '1px solid var(--accent-red)',
            background: 'var(--bg-card)',
            color: 'var(--accent-red)',
            cursor: 'pointer',
          }}
        >
          Show Error Toast
        </button>

        <button
          onClick={handleShowWithAction}
          style={{
            padding: '10px',
            border: '1px solid var(--accent-green)',
            background: 'var(--bg-card)',
            color: 'var(--accent-green)',
            cursor: 'pointer',
          }}
        >
          Show Toast with Action Button
        </button>
      </div>

      <ToastContainer />
    </div>
  );
}
