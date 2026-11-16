'use client';

import { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';

export default function ProgressBarAnimationExample() {
  const [redValue, setRedValue] = useState(0);
  const [greenValue, setGreenValue] = useState(0);
  const [orangeValue, setOrangeValue] = useState(0);
  const [yellowValue, setYellowValue] = useState(0);

  // Animate all progress bars independently
  useEffect(() => {
    const interval = setInterval(() => {
      setRedValue(prev => (prev >= 100 ? 0 : prev + 1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreenValue(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrangeValue(prev => (prev >= 100 ? 0 : prev + 3));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setYellowValue(prev => (prev >= 100 ? 0 : prev + 5));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <h2>ProgressBar Animation Smoothness Test</h2>
      <p>All progress bars animate continuously to demonstrate smooth transitions.</p>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Red Variant (Slow - 1% per 50ms)</h3>
        <ProgressBar value={redValue} max={100} color="red" label="Red Progress" />
      </div>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Green Variant (Medium - 2% per 50ms)</h3>
        <ProgressBar value={greenValue} max={100} color="green" label="Green Progress" />
      </div>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Orange Variant (Fast - 3% per 50ms)</h3>
        <ProgressBar value={orangeValue} max={100} color="orange" label="Orange Progress" />
      </div>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Yellow Variant (Very Fast - 5% per 50ms)</h3>
        <ProgressBar value={yellowValue} max={100} color="yellow" label="Yellow Progress" />
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h4>Animation Details:</h4>
        <ul style={{ marginTop: '10px', lineHeight: '1.8' }}>
          <li>CSS transition: <code>width 0.5s ease</code></li>
          <li>Glowing edge effect on the right side of each bar</li>
          <li>Gradient backgrounds for each color variant</li>
          <li>Smooth width updates via React state changes</li>
        </ul>
      </div>
    </div>
  );
}
