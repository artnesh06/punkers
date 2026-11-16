import ProgressBar from './ProgressBar';

export default function ProgressBarExample() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h3 style={{ marginBottom: '10px' }}>Red Progress Bar (Default)</h3>
        <ProgressBar value={5} max={100} />
      </div>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Green Progress Bar with Label</h3>
        <ProgressBar value={75} max={100} label="Health" color="green" />
      </div>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Orange Progress Bar</h3>
        <ProgressBar value={45} max={100} color="orange" />
      </div>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Yellow Progress Bar</h3>
        <ProgressBar value={90} max={100} color="yellow" />
      </div>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Progress Bar with Current/Max Format</h3>
        <ProgressBar value={0} max={100} current={33} label="Staked NFTs" />
      </div>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Progress Bar without Percentage Text</h3>
        <ProgressBar value={60} max={100} showPercentage={false} color="green" />
      </div>
    </div>
  );
}
