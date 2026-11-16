export type User = {
  id: string;
  address: string;
  discord: string | null;
  discordUsername: string | null;
  twitter: string | null;
  twitterUsername: string | null;
  points: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Staker = {
  id: string;
  userId: string;
  collectionId: string;
  tokenId: string;
  isStaked: boolean;
  stakedAt: Date | null;
  unstakedAt: Date | null;
  isDead: boolean;
  health: number;
  causeOfDeath: string | null;
  deathDate: Date | null;
  lastAudit: Date | null;
  penaltiesPaid: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PointTransaction = {
  id: string;
  userId: string;
  points: number;
  description: string | null;
  type: 'stake' | 'unstake' | 'bonus' | 'penalty';
  createdAt: Date;
};
