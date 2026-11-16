import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Toast, { ToastContainer } from './Toast';
import { ToastProvider } from '@/lib/hooks/useToast';

describe('Toast Component', () => {
  it('renders toast with message', () => {
    const onClose = jest.fn();
    render(
      <Toast
        message="Test message"
        type="info"
        duration={3000}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies correct type variant styling', () => {
    const { container, rerender } = render(
      <Toast message="Success" type="success" onClose={() => {}} />
    );
    expect(container.querySelector('.success')).toBeInTheDocument();

    rerender(<Toast message="Error" type="error" onClose={() => {}} />);
    expect(container.querySelector('.error')).toBeInTheDocument();

    rerender(<Toast message="Warning" type="warning" onClose={() => {}} />);
    expect(container.querySelector('.warning')).toBeInTheDocument();

    rerender(<Toast message="Info" type="info" onClose={() => {}} />);
    expect(container.querySelector('.info')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onAction = jest.fn();
    render(
      <Toast
        message="Test message"
        type="info"
        onClose={() => {}}
        action={{ label: 'Undo', onClick: onAction }}
      />
    );

    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('calls action onClick and closes toast when action button clicked', () => {
    const onAction = jest.fn();
    const onClose = jest.fn();

    render(
      <Toast
        message="Test message"
        type="info"
        onClose={onClose}
        action={{ label: 'Undo', onClick: onAction }}
      />
    );

    const button = screen.getByRole('button', { name: 'Undo' });
    fireEvent.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(
      <Toast message="Test message" type="info" onClose={() => {}} />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('auto-dismisses after duration', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();

    render(
      <Toast
        message="Test message"
        type="info"
        duration={1000}
        onClose={onClose}
      />
    );

    expect(onClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });
});

describe('ToastContainer', () => {
  it('renders toast container', () => {
    render(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );
    
    // Container should be present
    const container = document.querySelector('.toastContainer');
    expect(container).toBeInTheDocument();
  });
});
