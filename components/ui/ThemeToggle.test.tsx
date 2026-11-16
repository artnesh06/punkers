import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

describe('ThemeToggle', () => {
  it('renders with moon icon in dark mode', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /switch to light mode/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🌙');
  });

  it('toggles theme when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    
    // Initially dark mode (moon icon)
    expect(button).toHaveTextContent('🌙');
    
    // Click to switch to light mode
    fireEvent.click(button);
    
    // Should now show sun icon
    expect(button).toHaveTextContent('🌑');
    
    // Click again to switch back to dark mode
    fireEvent.click(button);
    
    // Should show moon icon again
    expect(button).toHaveTextContent('🌙');
  });

  it('applies custom className when provided', () => {
    render(
      <ThemeProvider>
        <ThemeToggle className="custom-class" />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has correct accessibility attributes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Toggle light/dark mode');
    expect(button).toHaveAttribute('aria-label');
  });
});
