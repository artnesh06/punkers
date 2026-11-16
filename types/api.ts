export interface UpdateOwnerRequest {
  address: string;
}

export interface UpdateOwnerResponse {
  success: boolean;
  updatedCount: number;
  message?: string;
}

export interface TotalPointsQuery {
  address: string;
}

export interface TotalPointsResponse {
  address: string;
  totalPoints: number;
  breakdown: {
    nftPoints: number;
    attributeBonus: number;
    transactionPoints: number;
  };
}

export interface LeaderboardQuery {
  page?: number;
  limit?: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  nftCount: number;
  level: number;
  audits: number;
  executions: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEntries: number;
    hasMore: boolean;
  };
}

// Collection Stats API
export interface CollectionStatsResponse {
  totalSupply: number;
  staked: number;
  floorPrice: string;
  volume: string;
  collections: Array<{
    id: string;
    name: string;
    count: number;
    staked: number;
  }>;
}

// Dead NFTs API
export interface DeadNFT {
  tokenId: string;
  collectionName: string;
  causeOfDeath: string;
  deathDate: Date | null;
  daysAlive: number;
  pointsLost: number;
  penaltiesPaid: number;
  metadata: {
    name: string;
    image: string;
  };
}

export interface DeadNFTsResponse {
  deadNFTs: DeadNFT[];
  totalDeaths: number;
  totalPointsLost: number;
  averageDaysAlive: number;
  totalPenaltiesPaid: number;
}

// NFT Health API
export interface NFTHealthResponse {
  tokenId: string;
  health: number;
  status: 'healthy' | 'warning' | 'critical' | 'dead' | 'unknown';
  isDead: boolean;
  isStaked: boolean;
  lastAudit: Date | null;
  causeOfDeath: string | null;
  deathDate: Date | null;
  owner: string;
  collection: {
    name: string;
    contractAddress: string;
  };
}

// Global Stats API
export interface GlobalStatsResponse {
  totalStaked: number;
  survivors: number;
  graveyard: number;
  totalPoints: number;
  totalUsers: number;
  topScore: number;
  averagePoints: number;
}

// Kill NFT API
export interface KillNFTRequest {
  tokenId: string;
  causeOfDeath: string;
  pointsLost?: number;
  penaltyPaid?: number;
}

export interface KillNFTResponse {
  success: boolean;
  message: string;
}

// Update Health API
export interface UpdateHealthRequest {
  tokenId: string;
  healthChange: number;
  reason?: string;
}

export interface UpdateHealthResponse {
  success: boolean;
  tokenId: string;
  newHealth: number;
  message: string;
}

// Audit API
export interface AuditRequest {
  tokenId: string;
  passed: boolean;
  penaltyPaid?: number;
}

export interface AuditResponse {
  success: boolean;
  message: string;
  passed: boolean;
}
