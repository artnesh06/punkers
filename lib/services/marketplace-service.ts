/**
 * Marketplace service for fetching NFT collection data
 * Supports multiple marketplace APIs
 */

export interface MarketplaceData {
  floorPrice: string;
  volume: string;
  currency: string;
}

/**
 * Fetch marketplace data from OpenSea API
 * Uses collection slug, not contract address
 */
async function fetchFromOpenSea(
  collectionSlug: string
): Promise<MarketplaceData> {
  const apiKey = process.env.OPENSEA_API_KEY;

  if (!apiKey) {
    throw new Error('OpenSea API key not configured');
  }

  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/collections/${collectionSlug}/stats`,
      {
        headers: {
          'X-API-KEY': apiKey,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenSea API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      floorPrice: data.total?.floor_price
        ? `${Number(data.total.floor_price).toFixed(4)} ETH`
        : '-',
      volume: data.total?.volume
        ? `${Math.round(Number(data.total.volume))} ETH`
        : '-',
      currency: 'ETH',
    };
  } catch (error) {
    console.error('OpenSea API error:', error);
    throw error;
  }
}

/**
 * Fetch marketplace data from Reservoir API
 */
async function fetchFromReservoir(
  contractAddress: string
): Promise<MarketplaceData> {
  const apiKey = process.env.RESERVOIR_API_KEY;

  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(
      `https://api.reservoir.tools/collections/v7?id=${contractAddress}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Reservoir API error: ${response.statusText}`);
    }

    const data = await response.json();
    const collection = data.collections?.[0];

    if (!collection) {
      throw new Error('Collection not found');
    }

    return {
      floorPrice: collection.floorAsk?.price?.amount?.native
        ? `${collection.floorAsk.price.amount.native.toFixed(4)} ETH`
        : '-',
      volume: collection.volume?.['1day']
        ? `${Math.round(collection.volume['1day'])} ETH`
        : '-',
      currency: 'ETH',
    };
  } catch (error) {
    console.error('Reservoir API error:', error);
    throw error;
  }
}

/**
 * Fetch marketplace data from Alchemy NFT API
 */
async function fetchFromAlchemy(
  contractAddress: string
): Promise<MarketplaceData> {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  if (!apiKey) {
    throw new Error('Alchemy API key not configured');
  }

  try {
    const response = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}/getFloorPrice?contractAddress=${contractAddress}`
    );

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      floorPrice: data.openSea?.floorPrice
        ? `${data.openSea.floorPrice} ETH`
        : '-',
      volume: '-', // Alchemy doesn't provide volume in this endpoint
      currency: 'ETH',
    };
  } catch (error) {
    console.error('Alchemy API error:', error);
    throw error;
  }
}

/**
 * Get marketplace data with fallback strategy
 * Tries multiple APIs in order: OpenSea -> Reservoir -> Alchemy
 */
export async function getMarketplaceData(
  identifier: string,
  isCollectionSlug: boolean = false
): Promise<MarketplaceData> {
  // Default fallback data
  const fallbackData: MarketplaceData = {
    floorPrice: '-',
    volume: '-',
    currency: 'ETH',
  };

  // Try OpenSea first if we have collection slug
  if (isCollectionSlug && process.env.OPENSEA_API_KEY) {
    try {
      return await fetchFromOpenSea(identifier);
    } catch (error) {
      console.log('OpenSea failed, trying Reservoir...');
    }
  }

  // Try Reservoir (works with contract address)
  if (!isCollectionSlug) {
    try {
      return await fetchFromReservoir(identifier);
    } catch (error) {
      console.log('Reservoir failed, trying Alchemy...');
    }
  }

  // Try Alchemy if Reservoir fails (works with contract address)
  if (!isCollectionSlug && process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    try {
      return await fetchFromAlchemy(identifier);
    } catch (error) {
      console.log('Alchemy failed, using fallback data');
    }
  }

  // Return fallback if all APIs fail
  console.warn('All marketplace APIs failed, returning fallback data');
  return fallbackData;
}

/**
 * Get marketplace data for multiple collections
 */
export async function getMultipleMarketplaceData(
  contractAddresses: string[]
): Promise<Map<string, MarketplaceData>> {
  const results = new Map<string, MarketplaceData>();

  // Fetch in parallel with error handling
  await Promise.all(
    contractAddresses.map(async (address) => {
      try {
        const data = await getMarketplaceData(address);
        results.set(address, data);
      } catch (error) {
        console.error(`Failed to fetch data for ${address}:`, error);
        results.set(address, {
          floorPrice: '-',
          volume: '-',
          currency: 'ETH',
        });
      }
    })
  );

  return results;
}
