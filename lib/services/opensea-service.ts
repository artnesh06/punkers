/**
 * OpenSea API Service
 * Wrapper for OpenSea API v2 endpoints
 * Documentation: https://docs.opensea.io/reference/api-overview
 */

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v2';

interface OpenSeaRequestOptions {
  method?: 'GET' | 'POST';
  body?: any;
}

/**
 * Make authenticated request to OpenSea API
 */
async function openSeaRequest(
  endpoint: string,
  options: OpenSeaRequestOptions = {}
) {
  const { method = 'GET', body } = options;

  if (!OPENSEA_API_KEY) {
    throw new Error('OpenSea API key not configured');
  }

  const url = `${OPENSEA_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'X-API-KEY': OPENSEA_API_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenSea API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Get NFTs owned by a specific address
 * Endpoint: GET /chain/{chain}/account/{address}/nfts
 * 
 * @param address - Wallet address
 * @param collectionSlug - Collection slug (optional) - NOT contract address!
 * @param limit - Number of items per page (max 200)
 * @param next - Pagination cursor
 * @param chain - Blockchain (default: ethereum)
 */
export async function getNFTsByOwner(
  address: string,
  collectionSlug?: string,
  limit: number = 50,
  next?: string,
  chain: string = 'ethereum'
) {
  let endpoint = `/chain/${chain}/account/${address}/nfts?limit=${limit}`;
  
  // IMPORTANT: Use 'collection' parameter, NOT 'contract_address'
  if (collectionSlug) {
    endpoint += `&collection=${collectionSlug}`;
  }
  
  if (next) {
    endpoint += `&next=${next}`;
  }

  const data = await openSeaRequest(endpoint);
  
  return {
    nfts: data.nfts || [],
    next: data.next || null,
  };
}

/**
 * Get ALL NFTs owned by an address, handling pagination automatically.
 * Fetches all pages until no more results.
 * 
 * @param address - Wallet address
 * @param collectionSlug - Collection slug (optional)
 * @param chain - Blockchain (default: ethereum)
 * @returns Array of all NFTs across all pages
 */
export async function getAllNFTsByOwner(
  address: string,
  collectionSlug?: string,
  chain: string = 'ethereum'
): Promise<any[]> {
  const allNFTs: any[] = [];
  let cursor: string | null = null;

  do {
    const { nfts, next } = await getNFTsByOwner(address, collectionSlug, 200, cursor || undefined, chain);
    allNFTs.push(...nfts);
    cursor = next;
  } while (cursor);

  return allNFTs;
}

/**
 * Get NFTs from a specific contract
 * Endpoint: GET /chain/{chain}/contract/{address}/nfts
 * 
 * @param contractAddress - Contract address
 * @param limit - Number of items per page (max 200)
 * @param next - Pagination cursor
 * @param chain - Blockchain (default: ethereum)
 */
export async function getNFTsByContract(
  contractAddress: string,
  limit: number = 50,
  next?: string,
  chain: string = 'ethereum'
) {
  let endpoint = `/chain/${chain}/contract/${contractAddress}/nfts?limit=${limit}`;
  
  if (next) {
    endpoint += `&next=${next}`;
  }

  const data = await openSeaRequest(endpoint);
  
  return {
    nfts: data.nfts || [],
    next: data.next || null,
  };
}

/**
 * Get single NFT details
 * Endpoint: GET /chain/{chain}/contract/{address}/nfts/{identifier}
 */
export async function getNFTDetails(
  contractAddress: string,
  tokenId: string,
  chain: string = 'ethereum'
) {
  const endpoint = `/chain/${chain}/contract/${contractAddress}/nfts/${tokenId}`;
  const data = await openSeaRequest(endpoint);
  return data.nft;
}

/**
 * Get collection details
 * Endpoint: GET /collections/{collection_slug}
 */
export async function getCollection(collectionSlug: string) {
  const endpoint = `/collections/${collectionSlug}`;
  return await openSeaRequest(endpoint);
}

/**
 * Get collection stats (floor price, volume, etc)
 * Endpoint: GET /collections/{collection_slug}/stats
 */
export async function getCollectionStats(collectionSlug: string) {
  const endpoint = `/collections/${collectionSlug}/stats`;
  return await openSeaRequest(endpoint);
}

/**
 * Get NFTs in a collection
 * Endpoint: GET /collection/{collection_slug}/nfts
 */
export async function getCollectionNFTs(
  collectionSlug: string,
  limit: number = 50,
  next?: string
) {
  let endpoint = `/collection/${collectionSlug}/nfts?limit=${limit}`;
  
  if (next) {
    endpoint += `&next=${next}`;
  }

  const data = await openSeaRequest(endpoint);
  
  return {
    nfts: data.nfts || [],
    next: data.next || null,
  };
}

/**
 * Get best listings for an NFT
 * Endpoint: GET /orders/chain/{chain}/seaport/listings
 */
export async function getNFTListings(
  contractAddress: string,
  tokenId: string,
  limit: number = 20,
  chain: string = 'ethereum'
) {
  const endpoint = `/orders/chain/${chain}/seaport/listings?asset_contract_address=${contractAddress}&token_ids=${tokenId}&limit=${limit}`;
  const data = await openSeaRequest(endpoint);
  return data.orders || [];
}

/**
 * Get best offers for an NFT
 * Endpoint: GET /orders/chain/{chain}/seaport/offers
 */
export async function getNFTOffers(
  contractAddress: string,
  tokenId: string,
  limit: number = 20,
  chain: string = 'ethereum'
) {
  const endpoint = `/orders/chain/${chain}/seaport/offers?asset_contract_address=${contractAddress}&token_ids=${tokenId}&limit=${limit}`;
  const data = await openSeaRequest(endpoint);
  return data.orders || [];
}

/**
 * Get traits for a collection
 * Endpoint: GET /traits/{collection_slug}
 */
export async function getCollectionTraits(collectionSlug: string) {
  const endpoint = `/traits/${collectionSlug}`;
  return await openSeaRequest(endpoint);
}

/**
 * Get events (sales, transfers, etc) for a collection
 * Endpoint: GET /events/collection/{collection_slug}
 */
export async function getCollectionEvents(
  collectionSlug: string,
  eventType?: 'sale' | 'transfer' | 'listing' | 'offer',
  limit: number = 50,
  next?: string
) {
  let endpoint = `/events/collection/${collectionSlug}?limit=${limit}`;
  
  if (eventType) {
    endpoint += `&event_type=${eventType}`;
  }
  
  if (next) {
    endpoint += `&next=${next}`;
  }

  const data = await openSeaRequest(endpoint);
  
  return {
    events: data.asset_events || [],
    next: data.next || null,
  };
}

/**
 * Get events for a specific NFT
 * Endpoint: GET /events/chain/{chain}/contract/{address}/nfts/{identifier}
 */
export async function getNFTEvents(
  contractAddress: string,
  tokenId: string,
  eventType?: 'sale' | 'transfer' | 'listing' | 'offer',
  limit: number = 50,
  chain: string = 'ethereum'
) {
  let endpoint = `/events/chain/${chain}/contract/${contractAddress}/nfts/${tokenId}?limit=${limit}`;
  
  if (eventType) {
    endpoint += `&event_type=${eventType}`;
  }

  const data = await openSeaRequest(endpoint);
  return data.asset_events || [];
}

/**
 * Refresh NFT metadata (force OpenSea to re-fetch from contract)
 * Endpoint: POST /chain/{chain}/contract/{address}/nfts/{identifier}/refresh
 */
export async function refreshNFTMetadata(
  contractAddress: string,
  tokenId: string,
  chain: string = 'ethereum'
) {
  const endpoint = `/chain/${chain}/contract/${contractAddress}/nfts/${tokenId}/refresh`;
  return await openSeaRequest(endpoint, { method: 'POST' });
}

/**
 * Verify if an address still owns a specific NFT via OpenSea API.
 * Used to detect transfers/listings — if NFT is no longer owned,
 * it should be auto-unstaked per game rules.
 * 
 * @param ownerAddress - Expected owner wallet address
 * @param tokenId - Token ID to check
 * @param chain - Blockchain (default: ethereum)
 * @returns true if still owned, false if transferred away
 */
export async function verifyNFTOwnership(
  ownerAddress: string,
  tokenId: string,
  chain: string = 'ethereum'
): Promise<boolean> {
  try {
    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;
    if (!contractAddress) return true; // fail-open if not configured

    const nft = await getNFTDetails(contractAddress, tokenId, chain);

    if (!nft || !nft.owners) return true; // fail-open if API error

    // OpenSea v2 returns owners array
    const owners: string[] = (nft.owners || []).map((o: any) =>
      (typeof o === 'string' ? o : o.address || '').toLowerCase()
    );

    return owners.includes(ownerAddress.toLowerCase());
  } catch (error) {
    // Fail-open: if OpenSea API is down, don't block the user
    console.warn(`OpenSea ownership check failed for token ${tokenId}:`, error);
    return true;
  }
}

/**
 * Verify NFT ownership using the account-based endpoint (getNFTsByOwner).
 * More reliable for recently transferred/purchased NFTs than getNFTDetails,
 * because the account endpoint reflects wallet state faster.
 *
 * @param ownerAddress - Expected owner wallet address
 * @param tokenId - Token ID to check
 * @returns true if owned, false if not found in wallet
 */
export async function verifyNFTOwnershipByAccount(
  ownerAddress: string,
  tokenId: string
): Promise<boolean> {
  try {
    const collectionSlug = process.env.OPENSEA_COLLECTION_SLUG;

    // Fetch all NFTs owned by this address in the collection (handles pagination)
    const nfts = await getAllNFTsByOwner(
      ownerAddress.toLowerCase(),
      collectionSlug
    );

    if (!nfts || nfts.length === 0) return false;

    // Check if the target tokenId is in the wallet
    return nfts.some(
      (nft: any) => String(nft.identifier) === String(tokenId)
    );
  } catch (error) {
    // Fail-open: if OpenSea API is down, don't block the user
    console.warn(`Account-based ownership check failed for token ${tokenId}:`, error);
    return true;
  }
}
