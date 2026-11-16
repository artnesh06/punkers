// Slot Machine Service - PUNKERS Game
// Based on HTML reference implementation

export const SLOT_SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎', '7️⃣', '🃏'] as const;
export type SlotSymbol = typeof SLOT_SYMBOLS[number];

export const BET_AMOUNTS = [10, 25, 50, 100] as const;
export type BetAmount = typeof BET_AMOUNTS[number];

export interface SlotResult {
  symbols: [SlotSymbol, SlotSymbol, SlotSymbol, SlotSymbol];
  payout: number;
  resultType: 'lose' | 'win' | 'jackpot' | 'mega';
  resultText: string;
  matchCount: number;
  matchSymbol?: SlotSymbol;
}

// Payout multipliers based on symbol and match count
const PAYOUT_MULTIPLIERS = {
  4: { '💎': 25, '7️⃣': 20, '⭐': 15, default: 8 },
  3: { '💎': 15, '7️⃣': 12, '⭐': 8, default: 5 },
  2: { default: 1.5 },
} as const;

/**
 * Generate slot spin result
 * @param betAmount - Amount wagered
 * @param spinsSinceLast - Spins since last win (for guaranteed win mechanic)
 * @returns Slot result with symbols and payout
 */
export function generateSlotResult(
  betAmount: BetAmount,
  spinsSinceLast: number
): SlotResult {
  let symbols: [SlotSymbol, SlotSymbol, SlotSymbol, SlotSymbol];

  // Guaranteed win every 3 spins (anti-frustration mechanic)
  if (spinsSinceLast >= 2) {
    // Force at least 2 matching symbols
    const matchSymbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
    symbols = [
      matchSymbol,
      matchSymbol,
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
    ];
    // Shuffle so match isn't always first 2
    symbols.sort(() => Math.random() - 0.5) as [SlotSymbol, SlotSymbol, SlotSymbol, SlotSymbol];
  } else {
    // Random result
    symbols = Array.from(
      { length: 4 },
      () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
    ) as [SlotSymbol, SlotSymbol, SlotSymbol, SlotSymbol];
  }

  return evaluateSlotResult(symbols, betAmount);
}

/**
 * Evaluate slot result and calculate payout
 */
export function evaluateSlotResult(
  symbols: [SlotSymbol, SlotSymbol, SlotSymbol, SlotSymbol],
  betAmount: BetAmount
): SlotResult {
  // Count symbol occurrences
  const counts: Record<string, number> = {};
  symbols.forEach((s) => (counts[s] = (counts[s] || 0) + 1));

  const maxCount = Math.max(...Object.values(counts));
  const matchSymbol = Object.keys(counts).find(
    (k) => counts[k] === maxCount
  ) as SlotSymbol | undefined;

  let payout = 0;
  let resultType: SlotResult['resultType'] = 'lose';
  let resultText = '';

  if (maxCount === 4) {
    // All 4 same - MEGA JACKPOT
    const multipliers = PAYOUT_MULTIPLIERS[4];
    const mult = (multipliers[matchSymbol as keyof typeof multipliers] as number) || multipliers.default;
    payout = betAmount * mult;
    resultType = 'mega';
    resultText = `💥 MEGA JACKPOT! +${payout} $PUNK`;
  } else if (maxCount === 3) {
    // 3 same - JACKPOT
    const multipliers = PAYOUT_MULTIPLIERS[3];
    const mult = (multipliers[matchSymbol as keyof typeof multipliers] as number) || multipliers.default;
    payout = betAmount * mult;
    resultType = 'jackpot';
    resultText = `🎰 JACKPOT! +${payout} $PUNK`;
  } else if (maxCount === 2) {
    // 2 same - small win
    payout = Math.floor(betAmount * PAYOUT_MULTIPLIERS[2].default);
    resultType = 'win';
    resultText = `✔ MATCH! +${payout} $PUNK`;
  } else {
    resultText = 'NO MATCH — Try again';
  }

  return {
    symbols,
    payout,
    resultType,
    resultText,
    matchCount: maxCount,
    matchSymbol,
  };
}
