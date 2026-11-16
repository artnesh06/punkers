/**
 * Simple script to test Redis connection
 * Run with: node scripts/test-redis.js
 */

const Redis = require('ioredis');

async function testRedis() {
  console.log('🔍 Testing Redis connection...\n');

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('❌ REDIS_URL is not set. Example: REDIS_URL=redis://default:password@localhost:6379');
    process.exit(1);
  }
  console.log(`📡 Connecting to: ${redisUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 100, 3000);
    },
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected successfully!\n');
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  try {
    // Test PING
    console.log('Testing PING...');
    const pong = await redis.ping();
    console.log(`✅ PING response: ${pong}\n`);

    // Test SET
    console.log('Testing SET...');
    await redis.set('test:key', 'Hello Redis!', 'EX', 60);
    console.log('✅ SET successful\n');

    // Test GET
    console.log('Testing GET...');
    const value = await redis.get('test:key');
    console.log(`✅ GET response: ${value}\n`);

    // Test INCR (for rate limiting)
    console.log('Testing INCR (rate limiting)...');
    const count = await redis.incr('test:counter');
    console.log(`✅ INCR response: ${count}\n`);

    // Test TTL
    console.log('Testing TTL...');
    const ttl = await redis.ttl('test:key');
    console.log(`✅ TTL response: ${ttl} seconds\n`);

    // Test DEL
    console.log('Testing DEL...');
    await redis.del('test:key', 'test:counter');
    console.log('✅ DEL successful\n');

    console.log('🎉 All tests passed! Redis is working correctly.\n');
    console.log('Next steps:');
    console.log('1. Add REDIS_URL to your .env file');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run dev');
    console.log('4. Test API endpoints\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if REDIS_URL is correct');
    console.error('2. Verify Redis server is running');
    console.error('3. Check network/firewall settings');
    console.error('4. Verify credentials\n');
  } finally {
    await redis.quit();
    console.log('👋 Connection closed');
  }
}

// Run tests
testRedis().catch(console.error);
