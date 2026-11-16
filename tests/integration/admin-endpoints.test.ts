/**
 * Integration tests for admin endpoints
 * These tests require a test database and admin API key
 */

describe('Admin Endpoints Integration Tests', () => {
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-api-key';
  const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  describe('POST /api/nft/kill', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/nft/kill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: '123',
          causeOfDeath: 'Test',
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should kill NFT with valid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/nft/kill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify({
          tokenId: '123',
          causeOfDeath: 'Integration Test',
          pointsLost: 50,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/nft/kill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify({
          tokenId: '123',
          // Missing causeOfDeath
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/nft/update-health', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/nft/update-health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenId: '123',
          healthChange: -10,
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should update health with valid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/nft/update-health`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify({
          tokenId: '123',
          healthChange: -20,
          reason: 'Integration Test',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.newHealth).toBeDefined();
    });
  });

  describe('GET /api/admin/dashboard', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/dashboard`);

      expect(response.status).toBe(401);
    });

    it('should return dashboard stats with valid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/dashboard`, {
        headers: {
          'x-api-key': ADMIN_API_KEY,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.overview).toBeDefined();
      expect(data.healthDistribution).toBeDefined();
      expect(data.recentActivity).toBeDefined();
    });
  });

  describe('POST /api/admin/bulk-operations', () => {
    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/bulk-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'kill',
          tokenIds: ['123', '456'],
          params: { causeOfDeath: 'Test' },
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should perform bulk operations with valid API key', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/bulk-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify({
          operation: 'updateHealth',
          tokenIds: ['123', '456'],
          params: {
            healthChange: -10,
            reason: 'Bulk Test',
          },
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
    });

    it('should validate maximum token limit', async () => {
      const tokenIds = Array.from({ length: 101 }, (_, i) => i.toString());

      const response = await fetch(`${BASE_URL}/api/admin/bulk-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_API_KEY,
        },
        body: JSON.stringify({
          operation: 'kill',
          tokenIds,
          params: { causeOfDeath: 'Test' },
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Maximum 100');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array.from({ length: 35 }, () =>
        fetch(`${BASE_URL}/api/admin/dashboard`, {
          headers: {
            'x-api-key': ADMIN_API_KEY,
          },
        })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter((r) => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should get cache stats', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/cache`, {
        headers: {
          'x-api-key': ADMIN_API_KEY,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.stats).toBeDefined();
    });

    it('should clear cache', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/cache`, {
        method: 'DELETE',
        headers: {
          'x-api-key': ADMIN_API_KEY,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
