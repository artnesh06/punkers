# Blockchain Module

This module provides services for interacting with Ethereum blockchain and NFT smart contracts.

## Files

- `nft-service.ts` - Main service for NFT operations
- `contract-abi.ts` - Contract ABIs for ERC721 and staking contracts

## Configuration

The module requires the following environment variables:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Your NFT contract address
NEXT_PUBLIC_CHAIN_ID=1             # Ethereum mainnet (1)
```

## Usage

### Get NFTs owned by an address

```typescript
import { getNFTsByOwner } from '@/lib/blockchain/nft-service';

const nfts = await getNFTsByOwner('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
console.log(nfts); // Array of NFT objects
```

### Get NFT metadata

```typescript
import { getNFTMetadata } from '@/lib/blockchain/nft-service';

const metadata = await getNFTMetadata('1');
console.log(metadata.name); // "Token #1"
console.log(metadata.image); // IPFS or HTTP URL
console.log(metadata.attributes); // Array of traits
```

### Check staking status

```typescript
import { getStakingStatus } from '@/lib/blockchain/nft-service';

const status = await getStakingStatus('1');
console.log(status.isStaked); // true/false
console.log(status.stakedAt); // Date or undefined
console.log(status.estimatedPoints); // Number
```

### Stake an NFT

```typescript
import { stakeNFT } from '@/lib/blockchain/nft-service';
import { useWriteContract } from 'wagmi';

// In a React component
const { writeContract } = useWriteContract();

const handleStake = async (tokenId: string) => {
  const txData = await stakeNFT(tokenId);
  await writeContract(txData);
};
```

### Unstake an NFT

```typescript
import { unstakeNFT } from '@/lib/blockchain/nft-service';
import { useWriteContract } from 'wagmi';

// In a React component
const { writeContract } = useWriteContract();

const handleUnstake = async (tokenId: string) => {
  const txData = await unstakeNFT(tokenId);
  await writeContract(txData);
};
```

## Error Handling

All functions include error handling and will:

- Log errors to console
- Return default/fallback values when possible
- Throw errors for critical failures

Example:

```typescript
try {
  const nfts = await getNFTsByOwner(address);
} catch (error) {
  console.error('Failed to fetch NFTs:', error);
  // Handle error appropriately
}
```

## IPFS Support

The service automatically converts IPFS URIs to HTTP URLs using the public IPFS gateway:

- `ipfs://QmXxx...` → `https://ipfs.io/ipfs/QmXxx...`

## Contract ABIs

The module includes ABIs for:

1. **ERC721** - Standard NFT operations (balanceOf, tokenURI, etc.)
2. **Staking** - Custom staking contract (stake, unstake, rewards)

To update ABIs, edit `contract-abi.ts` with your actual contract interface.

## Testing

Unit tests are available in `tests/unit/nft-service.test.ts`:

```bash
npm test -- tests/unit/nft-service.test.ts
```

## Notes

- The staking contract ABI is a placeholder and should be updated with your actual contract interface
- Estimated points calculation is a placeholder (currently returns 10 points/day when staked)
- The service uses viem for blockchain interactions
- All blockchain reads are performed through a public RPC endpoint
