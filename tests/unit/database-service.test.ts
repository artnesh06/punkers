import {
  getUserByAddress,
  createUser,
  updateUserPoints,
  getStakersByAddress,
  updateStaker,
  getLeaderboard,
  getPointTransactions,
  createPointTransaction,
} from '@/lib/services/database-service';
import { prisma } from '@/lib/prisma';

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    mst_users: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    mst_staker: {
      upsert: jest.fn(),
    },
    trn_point: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByAddress', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '1',
        address: '0x123',
        discord: null,
        twitter: null,
        points: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserByAddress('0x123');

      expect(result).toEqual(mockUser);
      expect(prisma.mst_users.findUnique).toHaveBeenCalledWith({
        where: { address: '0x123' },
      });
    });

    it('should return null when user not found', async () => {
      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserByAddress('0xnonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user with default points', async () => {
      const mockUser = {
        id: '1',
        address: '0x456',
        discord: null,
        twitter: null,
        points: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.mst_users.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await createUser('0x456');

      expect(result).toEqual(mockUser);
      expect(prisma.mst_users.create).toHaveBeenCalledWith({
        data: {
          address: '0x456',
          points: 0,
        },
      });
    });
  });

  describe('updateUserPoints', () => {
    it('should update user points', async () => {
      (prisma.mst_users.update as jest.Mock).mockResolvedValue({});

      await updateUserPoints('0x123', 500);

      expect(prisma.mst_users.update).toHaveBeenCalledWith({
        where: { address: '0x123' },
        data: { points: 500 },
      });
    });
  });

  describe('getStakersByAddress', () => {
    it('should return stakers for a user', async () => {
      const mockStakers = [
        {
          id: '1',
          userId: 'user1',
          collectionId: 'col1',
          tokenId: '1',
          isStaked: true,
          stakedAt: new Date(),
          unstakedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        address: '0x123',
        stakers: mockStakers,
      });

      const result = await getStakersByAddress('0x123');

      expect(result).toEqual(mockStakers);
      expect(prisma.mst_users.findUnique).toHaveBeenCalledWith({
        where: { address: '0x123' },
        include: { stakers: true },
      });
    });

    it('should return empty array when user not found', async () => {
      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getStakersByAddress('0xnonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('updateStaker', () => {
    it('should upsert staker record', async () => {
      const mockStaker = {
        id: '1',
        userId: 'user1',
        collectionId: 'col1',
        tokenId: '1',
        isStaked: true,
        stakedAt: new Date(),
        unstakedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.mst_staker.upsert as jest.Mock).mockResolvedValue(mockStaker);

      const result = await updateStaker({
        userId: 'user1',
        collectionId: 'col1',
        tokenId: '1',
        isStaked: true,
        stakedAt: new Date(),
      });

      expect(result).toEqual(mockStaker);
      expect(prisma.mst_staker.upsert).toHaveBeenCalled();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries with correct ranks', async () => {
      const mockUsers = [
        {
          address: '0x111',
          points: 1000,
          _count: { stakers: 5 },
        },
        {
          address: '0x222',
          points: 800,
          _count: { stakers: 3 },
        },
        {
          address: '0x333',
          points: 600,
          _count: { stakers: 2 },
        },
      ];

      (prisma.mst_users.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getLeaderboard(1, 10);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        rank: 1,
        address: '0x111',
        points: 1000,
        nftCount: 5,
      });
      expect(result[1]).toEqual({
        rank: 2,
        address: '0x222',
        points: 800,
        nftCount: 3,
      });
      expect(result[2]).toEqual({
        rank: 3,
        address: '0x333',
        points: 600,
        nftCount: 2,
      });
    });

    it('should handle pagination correctly', async () => {
      (prisma.mst_users.findMany as jest.Mock).mockResolvedValue([]);

      await getLeaderboard(2, 50);

      expect(prisma.mst_users.findMany).toHaveBeenCalledWith({
        select: {
          address: true,
          points: true,
          _count: {
            select: {
              stakers: true,
            },
          },
        },
        orderBy: {
          points: 'desc',
        },
        skip: 50,
        take: 50,
      });
    });
  });

  describe('getPointTransactions', () => {
    it('should return transactions for a user', async () => {
      const mockTransactions = [
        {
          id: '1',
          userId: 'user1',
          points: 100,
          description: 'Staking reward',
          type: 'stake',
          createdAt: new Date(),
        },
      ];

      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
      });
      (prisma.trn_point.findMany as jest.Mock).mockResolvedValue(
        mockTransactions
      );

      const result = await getPointTransactions('0x123');

      expect(result).toEqual(mockTransactions);
      expect(prisma.trn_point.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when user not found', async () => {
      (prisma.mst_users.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getPointTransactions('0xnonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('createPointTransaction', () => {
    it('should create a new transaction', async () => {
      const mockTransaction = {
        id: '1',
        userId: 'user1',
        points: 100,
        description: 'Test transaction',
        type: 'bonus',
        createdAt: new Date(),
      };

      (prisma.trn_point.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await createPointTransaction({
        userId: 'user1',
        points: 100,
        description: 'Test transaction',
        type: 'bonus',
      });

      expect(result).toEqual(mockTransaction);
      expect(prisma.trn_point.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          points: 100,
          description: 'Test transaction',
          type: 'bonus',
        },
      });
    });

    it('should handle missing description', async () => {
      const mockTransaction = {
        id: '1',
        userId: 'user1',
        points: 50,
        description: null,
        type: 'penalty',
        createdAt: new Date(),
      };

      (prisma.trn_point.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await createPointTransaction({
        userId: 'user1',
        points: 50,
        type: 'penalty',
      });

      expect(result).toEqual(mockTransaction);
      expect(prisma.trn_point.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          points: 50,
          description: null,
          type: 'penalty',
        },
      });
    });
  });
});
