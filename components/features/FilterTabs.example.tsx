'use client';

import { useState } from 'react';
import FilterTabs from './FilterTabs';

/**
 * Example usage of FilterTabs component
 * 
 * This component demonstrates how to use FilterTabs for filtering NFTs
 * on the Stake page by status (All, Staked, Unstaked).
 */
export default function FilterTabsExample() {
  const [activeFilter, setActiveFilter] = useState('all');

  // Example: Stake page filters
  const stakeFilters = [
    { value: 'all', label: 'All' },
    { value: 'staked', label: 'Staked' },
    { value: 'unstaked', label: 'Unstaked' },
  ];

  // Example: Gallery page filters
  const galleryFilters = [
    { value: 'all', label: 'All' },
    { value: 'common', label: 'Common' },
    { value: 'epic', label: 'Epic' },
    { value: 'legendary', label: 'Legendary' },
    { value: 'art', label: '1/1 ART' },
  ];

  // Example: Graveyard page filters
  const graveyardFilters = [
    { value: 'all', label: 'All' },
    { value: 'recent', label: 'Recent' },
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '40px', fontFamily: 'var(--font-display)' }}>
        FilterTabs Examples
      </h1>

      {/* Example 1: Stake Page Filters */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
          Stake Page Filters
        </h2>
        <FilterTabs
          options={stakeFilters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <p style={{ marginTop: '20px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          Active filter: <strong style={{ color: 'var(--accent-red)' }}>{activeFilter}</strong>
        </p>
      </section>

      {/* Example 2: Gallery Page Filters */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
          Gallery Page Filters
        </h2>
        <FilterTabs
          options={galleryFilters}
          activeFilter="all"
          onFilterChange={(filter) => console.log('Gallery filter:', filter)}
        />
      </section>

      {/* Example 3: Graveyard Page Filters */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
          Graveyard Page Filters
        </h2>
        <FilterTabs
          options={graveyardFilters}
          activeFilter="all"
          onFilterChange={(filter) => console.log('Graveyard filter:', filter)}
        />
      </section>

      {/* Example 4: With Custom ClassName */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
          With Custom ClassName
        </h2>
        <FilterTabs
          options={stakeFilters}
          activeFilter="staked"
          onFilterChange={(filter) => console.log('Custom filter:', filter)}
          className="my-custom-class"
        />
      </section>

      {/* Usage Instructions */}
      <section style={{ 
        marginTop: '60px', 
        padding: '20px', 
        border: '1px solid var(--border-color)',
        fontFamily: 'var(--font-mono)',
        fontSize: '14px',
        lineHeight: '1.8'
      }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--accent-red)' }}>
          Usage Instructions
        </h3>
        <pre style={{ 
          background: 'var(--bg-secondary)', 
          padding: '16px', 
          overflow: 'auto',
          borderRadius: '4px'
        }}>
{`import { FilterTabs } from '@/components/features';

const [activeFilter, setActiveFilter] = useState('all');

const options = [
  { value: 'all', label: 'All' },
  { value: 'staked', label: 'Staked' },
  { value: 'unstaked', label: 'Unstaked' },
];

<FilterTabs
  options={options}
  activeFilter={activeFilter}
  onFilterChange={setActiveFilter}
/>`}
        </pre>
      </section>
    </div>
  );
}
