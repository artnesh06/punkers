# WalletButton Component

A React component for connecting and managing Ethereum wallet connections using Wagmi and RainbowKit.

## Features

- **Three States**: Disconnected, Connecting, and Connected
- **Address Shortening**: Displays connected address in format `0xABC...XYZ`
- **Disconnect Functionality**: Click connected address to disconnect
- **Callbacks**: Optional `onConnect` and `onDisconnect` callbacks
- **Hydration Safe**: Prevents hydration mismatches with SSR

## Usage

```tsx
import WalletButton from '@/components/wallet/WalletButton';

// Basic usage
<WalletButton />

// With callbacks
<WalletButton
  onConnect={(address) => console.log('Connected:', address)}
  onDisconnect={() => console.log('Disconnected')}
/>
```

## Props

| Prop           | Type                        | Required | Description                            |
| -------------- | --------------------------- | -------- | -------------------------------------- |
| `onConnect`    | `(address: string) => void` | No       | Callback fired when wallet connects    |
| `onDisconnect` | `() => void`                | No       | Callback fired when wallet disconnects |

## States

### Disconnected

- Displays: "CONNECT"
- Action: Click to open wallet connection modal

### Connecting

- Displays: "Connecting..."
- Button is disabled during connection

### Connected

- Displays: Shortened address (e.g., "0x742...bEb")
- Action: Click to disconnect wallet

## Styling

The component uses CSS classes that can be styled in your global CSS:

- `.wallet-button` - Base button styles
- `.wallet-button.connected` - Styles when wallet is connected
- `.wallet-button:disabled` - Styles when button is disabled

## Requirements Satisfied

- ✅ 3.2: Show modal to select wallet provider on connect
- ✅ 3.4: Display shortened address when connected
- ✅ 3.6: Display "CONNECT" when disconnected
- ✅ 3.8: Handle disconnect wallet functionality
