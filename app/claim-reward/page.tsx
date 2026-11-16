import type { Metadata } from 'next';
import ClaimRewardPage from './ClaimRewardPage';

export const metadata: Metadata = {
  title: 'Claim Reward | Punkers',
  description: 'Claim your $PUNK reward distribution for Punkers NFT holders.',
};

export default function Page() {
  return <ClaimRewardPage />;
}
