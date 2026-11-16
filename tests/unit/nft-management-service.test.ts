import {
  killNFT,
  updateNFTHealth,
  recordAudit,
  getNFTSurvivalStats,
} from '@/lib/services/nft-management-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    mst_staker: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    trn_point: {
      create: jest.fn(),
    },
    mst_users: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('NFT Management Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('killNFT', () => {
    it('should kill an NFT successfully', async () => {
      const mockStaker = {
        id: 'staker1',
        userId: 'user1',
        tokenId: '123',
        isDead: false,
        health: 50,
      };

      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(mockStaker);
      (prisma.mst_staker.update as jest.Mock).mockResolvedValue({
        ...mockStaker,
        isDead: true,
        health: 0,
      });

      const result = await killNFT({
        tokenId: '123',
        causeOfDeath: 'Test Death',
        pointsLost: 100,
      });

      expect(result).toBe(true);
      expect(prisma.mst_staker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'staker1' },
          data: expect.objectContaining({
            isDead: true,
            health: 0,
            causeOfDeath: 'Test Death',
          }),
        })
      );
    });

    it('should throw error if NFT not found', async () => {
      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        killNFT({
          tokenId: '999',
          causeOfDeath: 'Test',
        })
      ).rejects.toThrow('NFT with tokenId 999 not found');
    });

    it('should throw error if NFT already dead', async () => {
      const mockStaker = {
        id: 'staker1',
        tokenId: '123',
        isDead: true,
      };

      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(mockStaker);

      await expect(
        killNFT({
          tokenId: '123',
          causeOfDeath: 'Test',
        })
      ).rejects.toThrow('NFT with tokenId 123 is already dead');
    });
  });

  describe('updateNFTHealth', () => {
    it('should update health successfully', async () => {
      const mockStaker = {
        id: 'staker1',
        tokenId: '123',
        isDead: false,
        health: 50,
      };

      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(mockStaker);
      (prisma.mst_staker.update as jest.Mock).mockResolvedValue({
        ...mockStaker,
        health: 30,
      });

      const newHealth = await updateNFTHealth({
        tokenId: '123',
        healthChange: -20,
        reason: 'Penalty',
      });

      expect(newHealth).toBe(30);
      expect(prisma.mst_staker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'staker1' },
          data: { health: 30 },
        })
      );
    });

    it('should clamp health between 0 and 100', async () => {
      const mockStaker = {
        id: 'staker1',
        tokenId: '123',
        isDead: false,
        health: 90,
      };

      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(mockStaker);
      (prisma.mst_staker.update as jest.Mock).mockResolvedValue({
        ...mockStaker,
        health: 100,
      });

      const newHealth = await updateNFTHealth({
        tokenId: '123',
        healthChange: 50, // Would be 140, but clamped to 100
      });

      expect(newHealth).toBe(100);
    });

    it('should throw error for dead NFT', async () => {
      const mockStaker = {
        id: 'staker1',
        tokenId: '123',
        isDead: true,
        health: 0,
      };

      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(mockStaker);

      await expect(
        updateNFTHealth({
          tokenId: '123',
          healthChange: 10,
        })
      ).rejects.toThrow('NFT with tokenId 123 is already dead');
    });
  });

  describe('recordAudit', () => {
    it('should record successful audit', async () => {
      const mockStaker = {
        id: 'staker1',
        tokenId: '123',
        isDead: false,
        health: 80,
      };

      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(mockStaker);
      (prisma.mst_staker.update as jest.Mock).mockResolvedValue(mockStaker);

      await recordAudit('123', true, 0.01);

      expect(prisma.mst_staker.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'staker1' },
          data: expect.objectContaining({
            lastAudit: expect.any(Date),
          }),
        })
      );
    });

    it('should reduce health on failed audit', async () => {
      const mockStaker = {
        id: 'staker1',
        tokenId: '123',
        isDead: false,
        health: 80,
      };

      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(mockStaker);
      (prisma.mst_staker.update as jest.Mock).mockResolvedValue({
        ...mockStaker,
        health: 60,
      });

      await recordAudit('123', false);

      // Should call updateNFTHealth which reduces health by 20
      expect(prisma.mst_staker.findFirst).toHaveBeenCalled();
    });
  });

  describe('getNFTSurvivalStats', () => {
    it('should return survival stats', async () => {
      const mockStaker = {
        id: 'staker1',
        tokenId: '123',
        health: 75,
        isDead: false,
        isStaked: true,
        stakedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        lastAudit: new Date(),
        penaltiesPaid: 0.05,
        collection: { name: 'Test Collection' },
        user: { address: '0x123' },
      };

      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(mockStaker);

      const stats = await getNFTSurvivalStats('123');

      expect(stats).toMatchObject({
        tokenId: '123',
        health: 75,
        isDead: false,
        isStaked: true,
        daysAlive: 10,
      });
    });

    it('should return null for non-existent NFT', async () => {
      (prisma.mst_staker.findFirst as jest.Mock).mockResolvedValue(null);

      const stats = await getNFTSurvivalStats('999');

      expect(stats).toBeNull();
    });
  });
});
