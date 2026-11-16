export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFTMetadata {
  name: string;
  image: string;
  attributes: NFTAttribute[];
}

export interface NFT {
  tokenId: string;
  contractAddress: string;
  owner: string;
  metadata: NFTMetadata;
}
