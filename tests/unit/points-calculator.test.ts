import {
  calculateTotalPoints,
  calculateNFTPoints,
  calculateAttributeBonus,
} from '@/lib/services/points-calculator';
import { prisma } from '@/lib/prisma';
import { NFTAttribute } from '@/types/nft';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    mst_users: {
      findUnique: jest.fn(),
    },
    mst_reward: {
      findFirst: jest.fn(),
    },
    mst_attributes_reward: {
      findFirst: jest.fn(),
    },
  },
}));

describe('Points Calculator Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateTotalPoints', () => {
    it('should return 0 for non-existent user', async () => {
      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await calculateTotalPoints('0xnonexistent');

      expect(result).toBe(0);
    });

    it('should calculate total points from staked NFTs and transactions', async () => {
      const stakedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const mockUser = {
        id: 'user1',
        address: '0x123',
        stakers: [
          {
            id: 'staker1',
            tokenId: '1',
            isStaked: true,
            stakedAt: stakedAt,
            collection: {
              rewards: [
                {
                  tokenId: '1',
                  pointsPerDay: 10,
                },
              ],
              attributes: [],
            },
          },
        ],
        transactions: [
          {
            id: 'tx1',
            points: 50,
          },
          {
            id: 'tx2',
            points: 30,
          },
        ],
      };

      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await calculateTotalPoints('0x123');

      // 10 days * 10 points/day = 100 points from staking
      // 50 + 30 = 80 points from transactions
      // Total = 180 points
      expect(result).toBeGreaterThanOrEqual(180);
    });

    it('should return 0 for user with no NFTs or transactions', async () => {
      const mockUser = {
        id: 'user1',
        address: '0x123',
        stakers: [],
        transactions: [],
      };

      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await calculateTotalPoints('0x123');

      expect(result).toBe(0);
    });

    it('should ensure points are non-negative', async () => {
      const mockUser = {
        id: 'user1',
        address: '0x123',
        stakers: [],
        transactions: [
          {
            id: 'tx1',
            points: -100,
          },
        ],
      };

      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await calculateTotalPoints('0x123');

      expect(result).toBe(0);
    });

    it('should not count points for unstaked NFTs', async () => {
      const mockUser = {
        id: 'user1',
        address: '0x123',
        stakers: [
          {
            id: 'staker1',
            tokenId: '1',
            isStaked: false,
            stakedAt: null,
            collection: {
              rewards: [
                {
                  tokenId: '1',
                  pointsPerDay: 10,
                },
              ],
              attributes: [],
            },
          },
        ],
        transactions: [],
      };

      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await calculateTotalPoints('0x123');

      expect(result).toBe(0);
    });
  });

  describe('calculateNFTPoints', () => {
    it('should return 0 for NFT without reward configuration', async () => {
      (prisma.mst_reward.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.mst_attributes_reward.findFirst as jest.Mock).mockResolvedValue(
        null
      );

      const result = await calculateNFTPoints('999', []);

      expect(result).toBe(0);
    });

    it('should calculate base points from reward configuration', async () => {
      const mockReward = {
        id: 'reward1',
        tokenId: '1',
        pointsPerDay: 15,
      };

      (prisma.mst_reward.findFirst as jest.Mock).mockResolvedValue(mockReward);
      (prisma.mst_attributes_reward.findFirst as jest.Mock).mockResolvedValue(
        null
      );

      const result = await calculateNFTPoints('1', []);

      expect(result).toBe(15);
    });

    it('should add attribute bonuses to base points', async () => {
      const mockReward = {
        id: 'reward1',
        tokenId: '1',
        pointsPerDay: 10,
      };

      const mockAttributeReward = {
        id: 'attr1',
        bonusPoints: 5,
      };

      (prisma.mst_reward.findFirst as jest.Mock).mockResolvedValue(mockReward);
      (prisma.mst_attributes_reward.findFirst as jest.Mock).mockResolvedValue(
        mockAttributeReward
      );

      const attributes: NFTAttribute[] = [
        {
          trait_type: 'Rarity',
          value: 'Legendary',
        },
      ];

      const result = await calculateNFTPoints('1', attributes);

      expect(result).toBe(15); // 10 base + 5 bonus
    });
  });

  describe('calculateAttributeBonus', () => {
    it('should return 0 for empty attributes', async () => {
      const result = await calculateAttributeBonus([]);

      expect(result).toBe(0);
    });

    it('should return 0 when no attribute rewards match', async () => {
      (prisma.mst_attributes_reward.findFirst as jest.Mock).mockResolvedValue(
        null
      );

      const attributes: NFTAttribute[] = [
        {
          trait_type: 'Background',
          value: 'Blue',
        },
      ];

      const result = await calculateAttributeBonus(attributes);

      expect(result).toBe(0);
    });

    it('should sum bonus points for matching attributes', async () => {
      (prisma.mst_attributes_reward.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: 'attr1',
          bonusPoints: 10,
        })
        .mockResolvedValueOnce({
          id: 'attr2',
          bonusPoints: 15,
        });

      const attributes: NFTAttribute[] = [
        {
          trait_type: 'Rarity',
          value: 'Legendary',
        },
        {
          trait_type: 'Background',
          value: 'Gold',
        },
      ];

      const result = await calculateAttributeBonus(attributes);

      expect(result).toBe(25); // 10 + 15
    });

    it('should handle numeric attribute values', async () => {
      (prisma.mst_attributes_reward.findFirst as jest.Mock).mockResolvedValue({
        id: 'attr1',
        bonusPoints: 20,
      });

      const attributes: NFTAttribute[] = [
        {
          trait_type: 'Level',
          value: 100,
        },
      ];

      const result = await calculateAttributeBonus(attributes);

      expect(result).toBe(20);
      expect(prisma.mst_attributes_reward.findFirst).toHaveBeenCalledWith({
        where: {
          traitType: 'Level',
          traitValue: '100', // Should be converted to string
        },
      });
    });
  });
});
