/**
 * Environment detection and configuration
 * Automatically detects Vercel deployment and adjusts services accordingly
 */

export const IS_VERCEL = process.env.VERCEL === '1';
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

/**
 * Check if Vercel KV is available
 */
export function hasVercelKV(): boolean {
  return !!(
    process.env.KV_URL &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  );
}

/**
 * Check if marketplace APIs are configured
 */
export function hasMarketplaceAPI(): boolean {
  return !!(
    process.env.OPENSEA_API_KEY ||
    process.env.RESERVOIR_API_KEY ||
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  );
}

/**
 * Get cache service based on environment
 */
export function getCacheServiceType(): 'vercel-kv' | 'in-memory' {
  if (IS_VERCEL && hasVercelKV()) {
    return 'vercel-kv';
  }
  return 'in-memory';
}

/**
 * Get rate limiter type based on environment
 */
export function getRateLimiterType(): 'upstash' | 'in-memory' {
  if (IS_VERCEL && hasVercelKV()) {
    return 'upstash';
  }
  return 'in-memory';
}

/**
 * Environment configuration
 */
export const ENV_CONFIG = {
  isVercel: IS_VERCEL,
  isProduction: IS_PRODUCTION,
  isDevelopment: IS_DEVELOPMENT,
  hasVercelKV: hasVercelKV(),
  hasMarketplaceAPI: hasMarketplaceAPI(),
  cacheService: getCacheServiceType(),
  rateLimiter: getRateLimiterType(),
  database: {
    url: process.env.DATABASE_URL,
    pooling: IS_VERCEL, // Enable pooling in Vercel
  },
  api: {
    adminKey: process.env.ADMIN_API_KEY,
    openSeaKey: process.env.OPENSEA_API_KEY,
    reservoirKey: process.env.RESERVOIR_API_KEY,
    alchemyKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  },
};

/**
 * Log environment configuration (development only)
 */
if (IS_DEVELOPMENT) {
  console.log('Environment Configuration:', {
    platform: IS_VERCEL ? 'Vercel' : 'Local',
    cache: ENV_CONFIG.cacheService,
    rateLimiter: ENV_CONFIG.rateLimiter,
    hasKV: ENV_CONFIG.hasVercelKV,
    hasMarketplace: ENV_CONFIG.hasMarketplaceAPI,
  });
}
