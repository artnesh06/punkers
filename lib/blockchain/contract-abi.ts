import { parseAbi } from 'viem';

/**
 * ERC721 standard ABI for NFT operations (read-only)
 * Used for querying NFT ownership and metadata from blockchain
 */
export const ERC721_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
]);
