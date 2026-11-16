'use client';

import { useState } from 'react';
import AdModal from './AdModal';

/**
 * Example usage of the AdModal component
 * 
 * This demonstrates how to use the AdModal component with the ticker system
 * to display ad information when a ticker item is clicked.
 */
export default function AdModalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const adDetails = {
    by: 'PUNKERS Team',
    date: '2024-01-15',
    slot: '#1',
    duration: '7 days',
    status: 'LIVE',
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Open Ad Modal
      </button>

      <AdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message="🎮 Join the PUNKERS Survival Game! Stake your NFTs, earn rewards, and compete for the top spot on the leaderboard!"
        details={adDetails}
      />
    </div>
  );
}

/**
 * Example with minimal details
 */
export function AdModalMinimalExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Open Simple Ad Modal
      </button>

      <AdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message="This is a simple ad message without additional details."
      />
    </div>
  );
}

/**
 * Example with expired status
 */
export function AdModalExpiredExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const adDetails = {
    by: 'Previous Advertiser',
    date: '2023-12-01',
    slot: '#5',
    duration: '7 days',
    status: 'EXPIRED',
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Open Expired Ad Modal
      </button>

      <AdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message="This ad campaign has ended. Thank you for your interest!"
        details={adDetails}
      />
    </div>
  );
}
