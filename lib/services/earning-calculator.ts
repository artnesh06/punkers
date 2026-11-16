import { 
  getCurrentEarning, 
  getCurrentTax,
  getPersonalStakeDay,
  determineNFTRarity,
  type NFTRarity 
} from './game-engine';

export interface EarningInfo {
  totalEarned: number;
  dailyRate: number;
  daysStaked: number;
  personalStakeDay: number;
  rarity: NFTRarity;
  canClaim: boolean;
}

/**
 * Calculate current earnings for a staked NFT
 * Uses PERSONAL stake day for earning rate (not global day)
 * 
 * Earnings accrue proportionally based on hours elapsed.
 * Users can claim partial earnings at any time.
 * 
 * @param stakedAt - When the NFT was staked
 * @param tokenId - NFT token ID
 * @param lastClaimDate - Last time earnings were claimed
 * @param traits - Optional OpenSea traits array for rarity detection
 */
export function calculateCurrentEarnings(
  stakedAt: Date,
  tokenId: string,
  lastClaimDate?: Date | null,
  traits?: Array<{ trait_type: string; value: string | number }>
): EarningInfo {
  const rarity = determineNFTRarity(tokenId, traits);
  const personalStakeDay = getPersonalStakeDay(stakedAt);
  const dailyRate = getCurrentEarning(personalStakeDay, rarity);
  
  // Calculate time since last claim
  const startDate = lastClaimDate || stakedAt;
  const now = new Date();
  const msSinceClaim = now.getTime() - startDate.getTime();
  const hoursSinceClaim = msSinceClaim / (60 * 60 * 1000);
  
  // No earnings if less than 1 hour since last claim
  if (hoursSinceClaim < 1) {
    return {
      totalEarned: 0,
      dailyRate,
      daysStaked: 0,
      personalStakeDay,
      rarity,
      canClaim: false,
    };
  }
  
  // Calculate accurate earnings by summing full days + partial day
  const fullDays = Math.floor(msSinceClaim / (24 * 60 * 60 * 1000));
  const remainingMs = msSinceClaim - (fullDays * 24 * 60 * 60 * 1000);
  const remainingHours = remainingMs / (60 * 60 * 1000);
  
  // Sum full days
  const fullDayEarnings = calculateAccurateEarnings(stakedAt, startDate, rarity, fullDays);
  
  // Add partial day earnings (pro-rata by hour)
  let partialEarnings = 0;
  if (remainingHours >= 1) {
    const msFromStakeToPartialDay = startDate.getTime() - stakedAt.getTime() + (fullDays * 24 * 60 * 60 * 1000);
    const partialPersonalDay = Math.floor(msFromStakeToPartialDay / (24 * 60 * 60 * 1000)) + 1;
    const partialDailyRate = getCurrentEarning(Math.max(1, partialPersonalDay), rarity);
    partialEarnings = Math.floor(partialDailyRate * Math.floor(remainingHours) / 24);
  }
  
  const totalEarned = fullDayEarnings + partialEarnings;
  const totalDays = fullDays + (remainingHours >= 1 ? remainingHours / 24 : 0);
  
  return {
    totalEarned,
    dailyRate,
    daysStaked: parseFloat(totalDays.toFixed(2)),
    personalStakeDay,
    rarity,
    canClaim: totalEarned > 0,
  };
}

/**
 * Calculate accurate earnings by summing each day's earning.
 * Only counts FULL days to prevent partial-day exploits.
 */
function calculateAccurateEarnings(
  stakedAt: Date,
  lastClaimDate: Date,
  rarity: NFTRarity,
  fullDays: number
): number {
  let totalEarned = 0;
  
  // For each full day since last claim, calculate the earning
  // based on the personal stake day at that point
  for (let i = 0; i < fullDays; i++) {
    // Calculate which personal day this corresponds to
    const claimDayOffset = i; // 0 = first unclaimed day
    const msFromStakeToClaimDay = lastClaimDate.getTime() - stakedAt.getTime() + (claimDayOffset * 24 * 60 * 60 * 1000);
    const personalDay = Math.floor(msFromStakeToClaimDay / (24 * 60 * 60 * 1000)) + 1;
    
    const dailyEarning = getCurrentEarning(Math.max(1, personalDay), rarity);
    totalEarned += dailyEarning;
  }
  
  return totalEarned;
}

/**
 * Calculate projected earnings for next N days
 */
export function calculateProjectedEarnings(
  stakedAt: Date,
  rarity: NFTRarity,
  days: number
): number {
  const personalStakeDay = getPersonalStakeDay(stakedAt);
  let totalProjected = 0;
  
  for (let i = 0; i < days; i++) {
    const futurePersonalDay = personalStakeDay + i;
    const dailyEarning = getCurrentEarning(futurePersonalDay, rarity);
    totalProjected += dailyEarning;
  }
  
  return totalProjected;
}

/**
 * Calculate net profit (earnings - tax) for a period
 */
export function calculateNetProfit(
  stakedAt: Date,
  rarity: NFTRarity,
  globalGameDay: number,
  days: number
): {
  totalEarnings: number;
  totalTax: number;
  netProfit: number;
  isProfit: boolean;
} {
  const personalStakeDay = getPersonalStakeDay(stakedAt);
  
  let totalEarnings = 0;
  let totalTax = 0;
  
  for (let i = 0; i < days; i++) {
    const futurePersonalDay = personalStakeDay + i;
    const futureGlobalDay = globalGameDay + i;
    
    const dailyEarning = getCurrentEarning(futurePersonalDay, rarity);
    const dailyTax = getCurrentTax(futureGlobalDay);
    
    totalEarnings += dailyEarning;
    totalTax += dailyTax;
  }
  
  const netProfit = totalEarnings - totalTax;
  
  return {
    totalEarnings,
    totalTax,
    netProfit,
    isProfit: netProfit > 0,
  };
}
