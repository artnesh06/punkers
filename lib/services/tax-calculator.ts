import { getCurrentTax, getGameDay, GAME_CONFIG } from './game-engine';

/**
 * Tax Status Types
 */
export type TaxStatusType = 'PAID' | 'DUE' | 'AUDITED' | 'EXECUTED';

export interface TaxStatus {
  status: TaxStatusType;
  isPaid: boolean;
  taxDue: number;
  penalty: number;
  totalDue: number;
  hoursOverdue: number;
  hoursSinceLastPayment: number;
  nextPaymentDue: Date;
  canPay: boolean;
  canBeAudited: boolean;
  canBeExecuted: boolean;
}

const getGracePeriodMs = () => GAME_CONFIG.auditGracePeriodHours * 60 * 60 * 1000;

/**
 * Calculate tax status for an NFT based on last payment time
 * This is calculated on-demand (no cron jobs needed)
 * 
 * All thresholds come from GAME_CONFIG:
 * - 0 to auditGracePeriodHours: PAID (no penalty)
 * - auditGracePeriodHours to executionGracePeriodHours: OVERDUE (penalty only if audited)
 * - executionGracePeriodHours+: EXECUTED (can be killed)
 */
export function calculateTaxStatus(
  lastTaxPayment: Date,
  gameStartDate: Date,
  lastAudit?: Date | null
): TaxStatus {
  const now = new Date();
  const hoursSinceLastPayment = 
    (now.getTime() - lastTaxPayment.getTime()) / (1000 * 60 * 60);
  
  const globalGameDay = getGameDay(gameStartDate);
  const taxDue = getCurrentTax(globalGameDay);
  
  let status: TaxStatusType;
  let penalty = 0;
  let hoursOverdue = 0;
  
  if (hoursSinceLastPayment < GAME_CONFIG.auditGracePeriodHours) {
    status = 'PAID';
  } else if (hoursSinceLastPayment < GAME_CONFIG.executionGracePeriodHours) {
    status = 'AUDITED';
    hoursOverdue = hoursSinceLastPayment - GAME_CONFIG.auditGracePeriodHours;
    // Penalty only applies if NFT was actually audited by another player
    if (lastAudit) {
      penalty = Math.floor(taxDue * (GAME_CONFIG.auditPenaltyPercent / 100));
    }
  } else {
    status = 'EXECUTED';
    hoursOverdue = hoursSinceLastPayment - GAME_CONFIG.auditGracePeriodHours;
    penalty = Math.floor(taxDue * (GAME_CONFIG.auditPenaltyPercent / 100));
  }
  
  const totalDue = taxDue + penalty;
  const nextPaymentDue = new Date(lastTaxPayment.getTime() + getGracePeriodMs());
  
  return {
    status,
    isPaid: hoursSinceLastPayment < GAME_CONFIG.auditGracePeriodHours,
    taxDue,
    penalty,
    totalDue,
    hoursOverdue,
    hoursSinceLastPayment,
    nextPaymentDue,
    canPay: status !== 'EXECUTED',
    canBeAudited: status === 'AUDITED',
    canBeExecuted: status === 'EXECUTED',
  };
}

/**
 * Calculate time remaining until next tax payment
 */
export function getTimeUntilNextTax(lastTaxPayment: Date): {
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  totalSeconds: number;
} {
  const now = new Date();
  const nextPaymentDue = new Date(lastTaxPayment.getTime() + getGracePeriodMs());
  const diff = nextPaymentDue.getTime() - now.getTime();
  
  if (diff <= 0) {
    const overdueDiff = Math.abs(diff);
    return {
      hours: Math.floor(overdueDiff / (1000 * 60 * 60)),
      minutes: Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((overdueDiff % (1000 * 60)) / 1000),
      isOverdue: true,
      totalSeconds: Math.floor(overdueDiff / 1000),
    };
  }
  
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isOverdue: false,
    totalSeconds: Math.floor(diff / 1000),
  };
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(lastTaxPayment: Date): string {
  const time = getTimeUntilNextTax(lastTaxPayment);
  
  if (time.isOverdue) {
    return `${time.hours}h ${time.minutes}m OVERDUE`;
  }
  
  return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
}
