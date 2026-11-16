'use client';

import { RainbowKitProvider, darkTheme, Theme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { ToastProvider } from '@/lib/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ThemeProvider } from './ThemeProvider';
import '@rainbow-me/rainbowkit/styles.css';
import '@/app/rainbowkit-custom.css';

const queryClient = new QueryClient();

// Custom Punkers theme based on darkTheme
const punkersTheme: Theme = {
  ...darkTheme({
    accentColor: '#e53030',
    accentColorForeground: 'white',
    borderRadius: 'none',
    fontStack: 'system',
    overlayBlur: 'small',
  }),
  colors: {
    ...darkTheme().colors,
    accentColor: '#e53030',
    accentColorForeground: '#ffffff',
    actionButtonBorder: '#2a2a2a',
    actionButtonBorderMobile: '#2a2a2a',
    actionButtonSecondaryBackground: '#151515',
    closeButton: '#888888',
    closeButtonBackground: '#151515',
    connectButtonBackground: '#0a0a0a',
    connectButtonBackgroundError: '#1a0a0a',
    connectButtonInnerBackground: '#151515',
    connectButtonText: '#e0e0e0',
    connectButtonTextError: '#e53030',
    connectionIndicator: '#00ff66',
    downloadBottomCardBackground: 'linear-gradient(180deg, #151515 0%, #0a0a0a 100%)',
    downloadTopCardBackground: 'linear-gradient(180deg, #1a1a1a 0%, #151515 100%)',
    error: '#e53030',
    generalBorder: '#2a2a2a',
    generalBorderDim: '#1a1a1a',
    menuItemBackground: '#151515',
    modalBackdrop: 'rgba(0, 0, 0, 0.85)',
    modalBackground: '#0a0a0a',
    modalBorder: '#2a2a2a',
    modalText: '#e0e0e0',
    modalTextDim: '#888888',
    modalTextSecondary: '#555555',
    profileAction: '#151515',
    profileActionHover: '#1a1a1a',
    profileForeground: '#0a0a0a',
    selectedOptionBorder: '#e53030',
    standby: '#ffcc00',
  },
  fonts: {
    body: "'Share Tech Mono', 'VT323', monospace",
  },
  radii: {
    actionButton: '0px',
    connectButton: '0px',
    menuButton: '0px',
    modal: '0px',
    modalMobile: '0px',
  },
  shadows: {
    connectButton: '0 0 0 1px #2a2a2a',
    dialog: '0 0 40px rgba(229, 48, 48, 0.1), 0 0 80px rgba(229, 48, 48, 0.05)',
    profileDetailsAction: '0 0 0 1px #2a2a2a',
    selectedOption: '0 0 0 1px #e53030',
    selectedWallet: '0 0 0 1px #e53030',
    walletLogo: '0 0 0 1px #2a2a2a',
  },
};

export function Providers({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={punkersTheme}
          modalSize="compact"
        >
          <ThemeProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
