'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Define mainnet chain manually to avoid import issues
const mainnet = {
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://eth.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
} as const;

// Get chain ID from environment variable, default to Ethereum mainnet (1)
const chainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1', 10);

// Configure supported chains based on NEXT_PUBLIC_CHAIN_ID
const supportedChains = [mainnet];

// Get WalletConnect project ID from environment
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

if (projectId === 'YOUR_PROJECT_ID') {
  console.warn(
    'WalletConnect Project ID not configured. Get one at https://cloud.walletconnect.com'
  );
}

export const config = getDefaultConfig({
  appName: 'Punkers Survival',
  projectId,
  chains: supportedChains,
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
        // WalletConnect requires valid project ID
        ...(projectId !== 'YOUR_PROJECT_ID' ? [walletConnectWallet, trustWallet] : []),
      ],
    },
  ],
  ssr: true,
});
