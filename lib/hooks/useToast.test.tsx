import { renderHook, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from './useToast';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should throw error when used outside ToastProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within a ToastProvider');
    
    consoleSpy.mockRestore();
  });

  it('should add toast to queue when showToast is called', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Test message' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('info'); // default type
  });

  it('should support different toast types', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Success', type: 'success' });
      result.current.showToast({ message: 'Error', type: 'error' });
      result.current.showToast({ message: 'Warning', type: 'warning' });
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[1].type).toBe('error');
    expect(result.current.toasts[2].type).toBe('warning');
  });

  it('should manage toast queue with multiple toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Toast 1' });
      result.current.showToast({ message: 'Toast 2' });
      result.current.showToast({ message: 'Toast 3' });
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].message).toBe('Toast 1');
    expect(result.current.toasts[1].message).toBe('Toast 2');
    expect(result.current.toasts[2].message).toBe('Toast 3');
  });

  it('should remove toast when removeToast is called', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Test message' });
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should auto-dismiss toast after duration', async () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Test message', duration: 3000 });
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward time by 3000ms
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(0);
    });
  });

  it('should not auto-dismiss when duration is 0', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Persistent toast', duration: 0 });
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Toast should still be there
    expect(result.current.toasts).toHaveLength(1);
  });

  it('should support action button', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    const mockAction = jest.fn();

    act(() => {
      result.current.showToast({
        message: 'Test message',
        action: {
          label: 'Undo',
          onClick: mockAction,
        },
      });
    });

    expect(result.current.toasts[0].action).toBeDefined();
    expect(result.current.toasts[0].action?.label).toBe('Undo');
    expect(result.current.toasts[0].action?.onClick).toBe(mockAction);
  });

  it('should generate unique IDs for each toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Toast 1' });
      result.current.showToast({ message: 'Toast 2' });
      result.current.showToast({ message: 'Toast 3' });
    });

    const ids = result.current.toasts.map((toast) => toast.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3);
  });

  it('should handle custom duration', async () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ message: 'Short toast', duration: 1000 });
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward time by 1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(0);
    });
  });
});
