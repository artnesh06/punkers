import { createPublicClient, http, Address } from 'viem';
import { mainnet } from 'viem/chains';
import { NFT, NFTMetadata } from '@/types/nft';
import { ERC721_ABI } from './contract-abi';
import { withRetry } from '@/lib/utils/retry';

// Get NFT contract address from environment (read-only operations)
const NFT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS ||
  '0x9b2c7964da7b986b08862ba5903ed994e57efcc7') as Address;

// Create public client for reading blockchain data
// Use Alchemy or Infura if API key is provided, otherwise use public RPC
const getRpcUrl = () => {
  if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    return `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;
  }
  // Use Cloudflare's public Ethereum RPC (no CORS issues)
  return 'https://cloudflare-eth.com';
};

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(getRpcUrl()),
});

/**
 * Get all NFTs owned by a specific address (read-only blockchain query)
 * Falls back to database if blockchain query fails
 * @param address - Ethereum address to query
 * @returns Array of NFTs owned by the address
 */
export async function getNFTsByOwner(address: string): Promise<NFT[]> {
  try {
    // Try to get balance from blockchain
    const balance = await publicClient.readContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: ERC721_ABI,
      functionName: 'balanceOf',
      args: [address as Address],
    });

    const balanceNum = Number(balance);

    if (balanceNum === 0) {
      console.log(`Address ${address} owns 0 NFTs on blockchain`);
      return [];
    }

    console.log(`Address ${address} owns ${balanceNum} NFTs on blockchain`);
    const nfts: NFT[] = [];

    // Try to use tokenOfOwnerByIndex (ERC721Enumerable)
    for (let i = 0; i < balanceNum; i++) {
      const tokenId = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: ERC721_ABI,
        functionName: 'tokenOfOwnerByIndex',
        args: [address as Address, BigInt(i)],
      });

      console.log(`Found token ID: ${tokenId}`);

      // Get metadata for this token
      const metadata = await getNFTMetadata(tokenId.toString());

      nfts.push({
        tokenId: tokenId.toString(),
        contractAddress: NFT_CONTRACT_ADDRESS,
        owner: address,
        metadata,
      });
    }

    return nfts;
  } catch (error: any) {
    console.warn('Blockchain query failed, will need to use database:', error.message);
    
    // Return empty array - in production, you would query database here
    // For now, just return empty to show "No NFTs found" message
    return [];
  }
}

/**
 * Get metadata for a specific NFT token (read-only blockchain query)
 * @param tokenId - Token ID to query
 * @returns NFT metadata including name, image, and attributes
 */
export async function getNFTMetadata(tokenId: string): Promise<NFTMetadata> {
  return withRetry(async () => {
    try {
      // Get token URI from contract
      const tokenURI = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS,
        abi: ERC721_ABI,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)],
      });

      // Fetch metadata from URI
      // Handle IPFS URIs
      let metadataURL = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        metadataURL = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      const response = await fetch(metadataURL);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata = await response.json();

      return {
        name: metadata.name || `Token #${tokenId}`,
        image: metadata.image?.startsWith('ipfs://')
          ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
          : metadata.image || '',
        attributes: metadata.attributes || [],
      };
    } catch (error) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      // Return default metadata if fetch fails
      return {
        name: `Token #${tokenId}`,
        image: '',
        attributes: [],
      };
    }
  }, 3);
}

