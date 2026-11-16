/**
 * Redis-based cache service
 * Re-export from cache-service-redis.ts
 */

export { cacheService } from './cache-service-redis';

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  GLOBAL_STATS: 60, // 1 minute
  COLLECTION_STATS: 300, // 5 minutes
  LEADERBOARD: 30, // 30 seconds
  NFT_HEALTH: 60, // 1 minute
  USER_POINTS: 30, // 30 seconds
};

// Cache key builders
export const CACHE_KEYS = {
  globalStats: () => 'stats:global',
  collectionStats: () => 'stats:collection',
  leaderboard: (page: number, limit: number) => `leaderboard:${page}:${limit}`,
  nftHealth: (tokenId: string) => `nft:health:${tokenId}`,
  userPoints: (address: string) => `user:points:${address}`,
  deadNFTs: (address: string) => `nft:dead:${address}`,
};
