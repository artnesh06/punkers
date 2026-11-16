import { render } from '@testing-library/react';
import AuroraBackground from './AuroraBackground';

describe('AuroraBackground', () => {
  it('renders canvas element with correct id', () => {
    const { container } = render(<AuroraBackground />);
    const canvas = container.querySelector('#auroraCanvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas?.tagName).toBe('CANVAS');
  });

  it('renders vignette overlay', () => {
    const { container } = render(<AuroraBackground />);
    const vignette = container.querySelector('[class*="vignette"]');
    expect(vignette).toBeInTheDocument();
  });

  it('canvas has correct dimensions on mount', () => {
    const { container } = render(<AuroraBackground />);
    const canvas = container.querySelector('#auroraCanvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    // Canvas should be sized to window width and 320px height
    expect(canvas.height).toBe(320);
  });
});
