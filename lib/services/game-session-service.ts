/**
 * Game Session Service
 * Manages mst_game records — creating, starting, ending, and querying active game sessions.
 * Separate from game-state-service.ts which handles runtime state calculations.
 */

import { getPrismaClient } from '@/lib/prisma';
import {
  TAX_SCHEDULE,
  EARNING_SCHEDULE,
  getGameDay,
  getCurrentTax,
} from './game-engine';

const prisma = getPrismaClient();

/**
 * Creates a new game session with status "pending".
 * Validates required fields, defaults optional ones, stores schedules as JSON.
 * Rejects if an active game session already exists (409).
 */
export async function createGameSession(config: {
  season: number;
  name: string;
  startDate: Date;
  durationDays?: number;
  survivorTarget?: number;
}) {
  // Validate required fields
  if (config.season == null || !config.name || !config.startDate) {
    throw new GameSessionError(
      'Missing required fields: season, name, and startDate are required',
      400
    );
  }

  // Check for existing active or pending game
  const existingActive = await prisma.mst_game.findFirst({
    where: { status: 'active' },
  });

  if (existingActive) {
    throw new GameSessionError(
      'An active game session already exists',
      409
    );
  }

  const game = await prisma.mst_game.create({
    data: {
      season: config.season,
      name: config.name,
      startDate: new Date(config.startDate),
      durationDays: config.durationDays ?? 60,
      survivorTarget: config.survivorTarget ?? 500,
      taxSchedule: structuredClone(TAX_SCHEDULE) as object[],
      earnSchedule: structuredClone(EARNING_SCHEDULE) as object[],
      status: 'pending',
    },
  });

  return game;
}


/**
 * Transitions a pending game to active.
 * Validates game exists (404) and is "pending" (400).
 * Updates status to "active", sets startDate to now, syncs gameState table.
 */
export async function startGameSession(gameId: string) {
  const game = await prisma.mst_game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new GameSessionError('Game session not found', 404);
  }

  if (game.status !== 'pending') {
    throw new GameSessionError(
      `Game cannot be started in current state: "${game.status}"`,
      400
    );
  }

  const now = new Date();

  const updatedGame = await prisma.mst_game.update({
    where: { id: gameId },
    data: {
      status: 'active',
      startDate: now,
    },
  });

  // Sync the gameState table so existing code continues to work
  const gameState = await prisma.gameState.findFirst();
  if (gameState) {
    await prisma.gameState.update({
      where: { id: gameState.id },
      data: {
        gameStartDate: now,
        isActive: true,
      },
    });
  } else {
    await prisma.gameState.create({
      data: {
        gameStartDate: now,
        isActive: true,
        totalStaked: 0,
        totalAlive: 0,
        totalDead: 0,
      },
    });
  }

  return updatedGame;
}

/**
 * Ends an active game session.
 * Validates game is "active" (400), sets status "ended", endedAt, endReason.
 * Updates totalParticipants/totalSurvivors/totalDead from mst_staker counts.
 */
export async function endGameSession(
  gameId: string,
  reason: 'manual' | 'survivor_target_reached' | 'duration_ended'
) {
  const game = await prisma.mst_game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    throw new GameSessionError('Game session not found', 404);
  }

  if (game.status !== 'active') {
    throw new GameSessionError(
      `Game cannot be ended in current state: "${game.status}"`,
      400
    );
  }

  // Get participant counts from mst_staker
  const [totalParticipants, totalSurvivors, totalDead] = await Promise.all([
    prisma.mst_staker.count({ where: { isStaked: true } }),
    prisma.mst_staker.count({ where: { isStaked: true, isDead: false } }),
    prisma.mst_staker.count({ where: { isDead: true } }),
  ]);

  const updatedGame = await prisma.mst_game.update({
    where: { id: gameId },
    data: {
      status: 'ended',
      endedAt: new Date(),
      endReason: reason,
      totalParticipants,
      totalSurvivors,
      totalDead,
    },
  });

  return updatedGame;
}


/**
 * Returns the active game session with computed fields, or null if none exists.
 * Computed fields: currentGameDay, currentTaxRate, survivorsRemaining.
 */
export async function getActiveGameSession() {
  const game = await prisma.mst_game.findFirst({
    where: { status: 'active' },
  });

  if (!game) {
    return null;
  }

  const currentGameDay = getGameDay(game.startDate);
  const currentTaxRate = getCurrentTax(currentGameDay);

  const survivorsRemaining = await prisma.mst_staker.count({
    where: { isStaked: true, isDead: false },
  });

  return {
    ...game,
    currentGameDay,
    currentTaxRate,
    survivorsRemaining,
  };
}

/**
 * Checks if end conditions are met and auto-ends the game.
 * Conditions: survivors <= survivorTarget OR currentGameDay > durationDays.
 * Returns true if the game was auto-ended.
 */
export async function checkAndEndGame(): Promise<boolean> {
  const game = await prisma.mst_game.findFirst({
    where: { status: 'active' },
  });

  if (!game) {
    return false;
  }

  const currentGameDay = getGameDay(game.startDate);
  const survivorsRemaining = await prisma.mst_staker.count({
    where: { isStaked: true, isDead: false },
  });

  // Only auto-end if enough participants have entered the game
  const deadCount = await prisma.mst_staker.count({ where: { isDead: true } });
  const totalStaked = await prisma.mst_staker.count({ where: { isStaked: true } });
  const totalParticipants = totalStaked + deadCount;
  if (totalParticipants <= game.survivorTarget) {
    return false;
  }

  let endReason: 'survivor_target_reached' | 'duration_ended' | null = null;

  if (survivorsRemaining <= game.survivorTarget) {
    endReason = 'survivor_target_reached';
  } else if (currentGameDay > game.durationDays) {
    endReason = 'duration_ended';
  }

  if (endReason) {
    await endGameSession(game.id, endReason);
    return true;
  }

  return false;
}

/**
 * Returns true if the game is locked (ended).
 * Returns false if no mst_game records exist (backward compatibility).
 * Returns false if the latest game is "pending" or "active".
 * Only returns true if there is an "ended" game AND no "active" game exists.
 */
export async function isGameLocked(): Promise<boolean> {
  // Check if there's an active game — if so, not locked
  const activeGame = await prisma.mst_game.findFirst({
    where: { status: 'active' },
    select: { status: true },
  });

  if (activeGame) {
    return false;
  }

  // Check if there's an ended game (most recent)
  const endedGame = await prisma.mst_game.findFirst({
    where: { status: 'ended' },
    orderBy: { endedAt: 'desc' },
    select: { status: true },
  });

  // Only locked if there's actually an ended game
  // No games at all = not locked (backward compat)
  // Only pending games = not locked
  return endedGame !== null;
}

/**
 * Custom error class for game session operations.
 * Carries an HTTP status code for API route handlers.
 */
export class GameSessionError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'GameSessionError';
    this.statusCode = statusCode;
  }
}
