export interface ClaimStatusResponse {
  success: boolean;
  eligible: boolean;
  address: string;
  count: number;
  rewardAmount: number;
  isClaimed: boolean;
  claimedAt: string | null;
}

export interface ClaimResponse {
  success: boolean;
  address?: string;
  count?: number;
  rewardAmount?: number;
  newBalance?: number;
  claimedAt?: string;
  error?: string;
}
