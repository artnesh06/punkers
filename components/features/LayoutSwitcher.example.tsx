'use client';

import { useState } from 'react';
import LayoutSwitcher, { type LayoutOption } from './LayoutSwitcher';

export default function LayoutSwitcherExample() {
  const [layout, setLayout] = useState<LayoutOption>('grid3');

  return (
    <div style={{ padding: '20px', background: '#0a0a0a', minHeight: '100vh' }}>
      <h2 style={{ color: '#e0e0e0', marginBottom: '20px' }}>
        Layout Switcher Example
      </h2>

      <LayoutSwitcher activeLayout={layout} onLayoutChange={setLayout} />

      <div style={{ marginTop: '30px', color: '#888' }}>
        <p>Current Layout: <strong style={{ color: '#e53030' }}>{layout}</strong></p>
        
        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #2a2a2a', background: '#151515' }}>
          <h3 style={{ color: '#ffcc00', marginBottom: '15px' }}>Layout Descriptions:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#e0e0e0' }}>Grid 3:</strong> 3-column grid layout (default)
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#e0e0e0' }}>Grid 2:</strong> 2-column grid layout with larger cards
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#e0e0e0' }}>Grid 4:</strong> 4-column grid layout with compact cards
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#e0e0e0' }}>List:</strong> Single column list view
            </li>
            <li style={{ marginBottom: '10px' }}>
              <strong style={{ color: '#e0e0e0' }}>List Detail:</strong> Single column with detailed information
            </li>
          </ul>
        </div>

        <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #2a2a2a', background: '#151515' }}>
          <h3 style={{ color: '#00ff66', marginBottom: '15px' }}>Usage Example:</h3>
          <pre style={{ background: '#0a0a0a', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
            <code style={{ color: '#888', fontSize: '13px' }}>
{`import LayoutSwitcher from './LayoutSwitcher';

function StakePage() {
  const [layout, setLayout] = useState('grid3');

  return (
    <div>
      <LayoutSwitcher
        activeLayout={layout}
        onLayoutChange={setLayout}
      />
      {/* Your NFT grid/list here */}
    </div>
  );
}`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
