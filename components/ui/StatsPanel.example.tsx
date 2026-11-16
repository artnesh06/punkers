import StatsPanel from './StatsPanel';
import type { StatItem } from './StatsPanel';

/**
 * StatsPanel Component Examples
 *
 * A reusable component for displaying statistics in a responsive grid layout
 * with gradient borders and color variants matching the PUNKERS design system.
 */

export default function StatsPanelExamples() {
  // Example 1: 4-column grid (default) - Home page stats
  const homeStats: StatItem[] = [
    { label: 'Total Staked', value: '1,234', color: 'green' },
    { label: 'Survivors', value: 500, color: 'white' },
    { label: 'Graveyard', value: 42, color: 'red' },
    { label: 'Day', value: 7, color: 'yellow' },
  ];

  // Example 2: 2-column grid - Treasury stats
  const treasuryStats: StatItem[] = [
    { label: 'Treasury', value: '10,000 $PUNK', color: 'green' },
    { label: 'Tax Today', value: '250 $PUNK', color: 'green' },
  ];

  // Example 3: 3-column grid - Stake page stats
  const stakeStats: StatItem[] = [
    { label: 'Your Staked', value: 12, color: 'white' },
    { label: 'Earnings', value: '144 $PUNK', color: 'green' },
    { label: 'Tax Rate', value: '50%', color: 'yellow' },
  ];

  // Example 4: With live indicator
  const liveStats: StatItem[] = [
    { label: 'Active Players', value: 234, color: 'green', live: true },
    { label: 'Total Kills', value: 18, color: 'red' },
    { label: 'Bounty Pool', value: '5,000 $PUNK', color: 'yellow' },
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '40px' }}>StatsPanel Examples</h1>

      {/* Example 1: 4-column grid */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px' }}>4-Column Grid (Default)</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Used for home page stats and main dashboard metrics
        </p>
        <StatsPanel stats={homeStats} />
      </section>

      {/* Example 2: 2-column grid */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px' }}>2-Column Grid</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Used for treasury and paired statistics
        </p>
        <StatsPanel stats={treasuryStats} columns={2} />
      </section>

      {/* Example 3: 3-column grid */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px' }}>3-Column Grid</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Used for stake page and balanced layouts
        </p>
        <StatsPanel stats={stakeStats} columns={3} />
      </section>

      {/* Example 4: With live indicator */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px' }}>With Live Indicator</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Shows real-time data with pulsing indicator
        </p>
        <StatsPanel stats={liveStats} columns={3} />
      </section>

      {/* Example 5: Custom className */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px' }}>With Custom Styling</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Can be extended with custom CSS classes
        </p>
        <StatsPanel
          stats={homeStats}
          className="custom-stats-panel"
          columns={4}
        />
      </section>

      {/* Color Variants Reference */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ marginBottom: '20px' }}>Color Variants</h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Available color options for stat values
        </p>
        <StatsPanel
          stats={[
            { label: 'Green', value: '100', color: 'green' },
            { label: 'Red', value: '100', color: 'red' },
            { label: 'Yellow', value: '100', color: 'yellow' },
            { label: 'White', value: '100', color: 'white' },
          ]}
          columns={4}
        />
      </section>

      {/* Responsive Behavior */}
      <section>
        <h2 style={{ marginBottom: '20px' }}>Responsive Behavior</h2>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <li>
            <strong>Desktop (1024px+):</strong> 4 columns for cols4, 3 for
            cols3, 2 for cols2
          </li>
          <li>
            <strong>Tablet (768px-1023px):</strong> 2 columns for cols4, 2 for
            cols3, 2 for cols2
          </li>
          <li>
            <strong>Mobile (&lt;768px):</strong> 2 columns for all layouts
          </li>
        </ul>
      </section>
    </div>
  );
}
