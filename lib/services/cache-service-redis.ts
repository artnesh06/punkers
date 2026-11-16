/**
 * Redis-based cache service
 * Works on any platform (Vercel, local, other hosting)
 */

import Redis from 'ioredis';

class RedisCacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to Redis
   */
  private connect() {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (!redisUrl) {
        console.warn('REDIS_URL not configured, cache will not work');
        return;
      }

      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('Redis connected successfully');
      });

      this.redis.on('error', (err) => {
        console.error('Redis error:', err);
        this.isConnected = false;
      });

      // Connect asynchronously
      this.redis.connect().catch((err) => {
        console.error('Failed to connect to Redis:', err);
      });
    } catch (error) {
      console.error('Error initializing Redis:', error);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL in seconds
   */
  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }

    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  /**
   * Get or set pattern - fetch if not in cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetcher();
    await this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.redis || !this.isConnected) {
      return {
        connected: false,
        size: 0,
        keys: [],
      };
    }

    try {
      const keys = await this.redis.keys('*');
      return {
        connected: true,
        size: keys.length,
        keys: keys.slice(0, 100), // Limit to first 100 keys
      };
    } catch (error) {
      console.error('Redis stats error:', error);
      return {
        connected: false,
        size: 0,
        keys: [],
      };
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.redis !== null;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
export const cacheService = new RedisCacheService();

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
