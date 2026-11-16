# Implementation Plan: Game System Completion

## Overview

Complete the PUNKERS NFT survival game system by implementing game session management, winner snapshots, game lock mechanism, auto-registration of new NFTs, admin API routes, public winners API, and frontend changes (game over banner, winners page, graveyard pagination fixes). Tasks are ordered by dependency: backend services → API routes → frontend → tests.

## Tasks

- [x] 1. Generate Prisma client for new models
  - Run `npx prisma generate` to ensure `mst_game` and `mst_winner` models are available in the Prisma client
  - Verify the generated types include `mst_game` and `mst_winner` with all fields from schema.prisma
  - _Requirements: 1.1, 6.1_

- [x] 2. Implement Game Session Service
  - [x] 2.1 Create `lib/services/game-session-service.ts` with core CRUD functions
    - Implement `createGameSession(config)` — validates required fields (season, name, startDate), defaults durationDays=60 and survivorTarget=500, stores TAX_SCHEDULE and EARNING_SCHEDULE as JSON, checks for existing active game (409), inserts mst_game with status "pending"
    - Implement `startGameSession(gameId)` — validates game exists (404) and is "pending" (400), updates status to "active", sets startDate to now, syncs gameState table (gameStartDate + isActive=true)
    - Implement `endGameSession(gameId, reason)` — validates game is "active" (400), sets status "ended", endedAt, endReason, updates totalParticipants/totalSurvivors/totalDead from mst_staker counts
    - Implement `getActiveGameSession()` — returns mst_game with status "active" or null, includes computed currentGameDay, currentTaxRate, survivorsRemaining
    - Implement `checkAndEndGame()` — checks if survivors <= survivorTarget or currentGameDay > durationDays, auto-ends with appropriate endReason
    - Implement `isGameLocked()` — returns true if active game has status "ended", returns false if no mst_game records exist (backward compat)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.3, 4.4, 5.1, 5.2, 5.3, 10.1_

  - [ ]* 2.2 Write property test: Game creation produces a pending session
    - **Property 1: Game creation produces a pending session**
    - **Validates: Requirements 1.1, 1.4**

  - [ ]* 2.3 Write property test: Missing required fields are rejected
    - **Property 2: Missing required fields are rejected**
    - **Validates: Requirements 1.2**

  - [ ]* 2.4 Write property test: Starting a game transitions to active and syncs gameState
    - **Property 3: Starting a game transitions to active and syncs gameState**
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 2.5 Write property test: Only pending games can be started
    - **Property 4: Only pending games can be started**
    - **Validates: Requirements 2.3**

  - [ ]* 2.6 Write property test: Active game query returns correct computed fields
    - **Property 5: Active game query returns correct computed fields**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 2.7 Write property test: Ending a game sets correct status, timestamps, and counts
    - **Property 6: Ending a game sets correct status, timestamps, and counts**
    - **Validates: Requirements 4.1, 4.3**

  - [ ]* 2.8 Write property test: Only active games can be ended
    - **Property 8: Only active games can be ended**
    - **Validates: Requirements 4.4**

- [x] 3. Implement Winner Snapshot Service
  - [x] 3.1 Create `lib/services/winner-snapshot-service.ts`
    - Implement `createWinnerSnapshot(gameId)` — queries alive staked NFTs, joins with user points, ranks by totalPoints DESC, creates mst_winner records with gameId, userId, address, tokenId, rank, totalPoints, rarity (via determineNFTRarity), survivedDays (stakedAt to endedAt). Idempotent: if snapshot exists, return existing records.
    - Implement `getWinners(gameId, page, limit)` — returns paginated mst_winner records ordered by rank ASC, with total count
    - Implement `hasSnapshot(gameId)` — checks if any mst_winner records exist for the gameId
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3_

  - [ ]* 3.2 Write property test: Winner snapshot contains exactly the alive staked NFTs ranked by points
    - **Property 10: Winner snapshot contains exactly the alive staked NFTs, ranked by points**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 3.3 Write property test: Winner snapshot creation is idempotent
    - **Property 11: Winner snapshot creation is idempotent**
    - **Validates: Requirements 6.4**

  - [ ]* 3.4 Write property test: Winners query returns correctly ordered and paginated results
    - **Property 12: Winners query returns correctly ordered and paginated results**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 4. Modify Game State Service for mst_game integration
  - [x] 4.1 Update `lib/services/game-state-service.ts` getGameState()
    - Import and call `getActiveGameSession()` first; if an active mst_game exists, use its startDate and config instead of the gameState table
    - Fall back to existing gameState table logic when no mst_game record exists (backward compat)
    - Call `checkAndEndGame()` when `isGameComplete` is detected, triggering auto-end flow
    - Wire `endGameSession` to call `createWinnerSnapshot` when ending
    - _Requirements: 3.3, 5.1, 5.4, 4.2_

  - [ ]* 4.2 Write property test: Auto-end detection triggers on getGameState
    - **Property 9: Auto-end detection triggers on getGameState**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 5. Checkpoint — Backend services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add auto-registration of new NFTs in Staking Service
  - [x] 6.1 Add `autoRegisterNewNFTs(address, userId, collectionId)` to `lib/services/staking-service.ts`
    - Use `getNFTsByOwner` from opensea-service to fetch current wallet NFTs
    - Compare with existing mst_staker records for the user
    - Create new mst_staker records for missing NFTs with isStaked=true, stakedAt=now, lastTaxPayment=now, lastClaimDate=now
    - Fail-open: if OpenSea API fails, log warning and skip (don't block the parent operation)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 6.2 Wire auto-registration into claim and pay-tax flows
    - In `app/api/staking/claim/route.ts`: after successful claim, call `autoRegisterNewNFTs` and include `autoRegistered` array in response
    - In `app/api/staking/pay-tax/route.ts`: after successful tax payment, call `autoRegisterNewNFTs` and include `autoRegistered` array in response
    - _Requirements: 9.1, 9.2_

  - [ ]* 6.3 Write property test: Auto-registration creates staker records for new wallet NFTs
    - **Property 13: Auto-registration creates staker records for new wallet NFTs**
    - **Validates: Requirements 9.1, 9.2, 9.4**

- [x] 7. Add game lock to all action endpoints
  - [x] 7.1 Add `isGameLocked()` check to action API routes
    - Add game lock check at the top of: `app/api/staking/stake-all/route.ts`, `app/api/staking/claim/route.ts`, `app/api/staking/pay-tax/route.ts`, `app/api/nft/kill/route.ts`
    - Import `isGameLocked` from game-session-service, return 403 `{ error: "Game has ended" }` when locked
    - Also add lock check to `stakeNFT` in staking-service.ts (already partially exists, update to use `isGameLocked()`)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 7.2 Write property test: Game lock blocks all action endpoints when game is ended
    - **Property 14: Game lock blocks all action endpoints when game is ended**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 8. Implement Admin API routes for game management
  - [x] 8.1 Create `app/api/admin/game/create/route.ts`
    - POST handler with requireAdmin + rateLimitAdmin middleware
    - Parse body (season, name, startDate, durationDays, survivorTarget), call `createGameSession`, return 201 with game record
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 8.2 Create `app/api/admin/game/start/route.ts`
    - POST handler with requireAdmin, parse body (gameId), call `startGameSession`, return 200
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 8.3 Create `app/api/admin/game/end/route.ts`
    - POST handler with requireAdmin, parse body (gameId), call `endGameSession` with reason "manual", call `createWinnerSnapshot`, return 200 with game + winnersCount
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 8.4 Create `app/api/admin/game/active/route.ts`
    - GET handler with requireAdmin, call `getActiveGameSession`, return 200 with game or null
    - _Requirements: 3.1, 3.2_

- [x] 9. Implement public Winners API route
  - [x] 9.1 Create `app/api/game/winners/route.ts`
    - GET handler (public, no auth required), parse query params (gameId, page, limit), call `getWinners`, return paginated results with total count
    - Return 404 if gameId not found or game not ended
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Checkpoint — API routes and backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend: Game Over banner component
  - [x] 11.1 Create `components/game/GameOverBanner.tsx`
    - Shared component that displays "GAME OVER" banner with link to /winners page
    - Accept `isGameComplete` prop, render nothing when false
    - Style with existing game.module.css patterns (panel, panelTitle)
    - _Requirements: 11.1, 11.2_

  - [x] 11.2 Add GameOverBanner to Stake page
    - Import and render GameOverBanner in `app/stake/page.tsx` when `gameState?.isGameComplete` is true
    - Hide "ENTER GAME" button and tax/claim action buttons when game is complete
    - _Requirements: 11.1, 11.3_

  - [x] 11.3 Add GameOverBanner to Survival page
    - Import and render GameOverBanner in `app/survival/page.tsx` when `gameState?.isGameComplete` is true
    - Replace bounty hunting section with the banner when game is over
    - _Requirements: 11.2_

- [x] 12. Frontend: Winners page
  - [x] 12.1 Create `app/winners/page.tsx`
    - Client component that fetches /api/game/winners with pagination
    - Display ranked list: rank, shortened address, tokenId, totalPoints, rarity badge, survivedDays
    - Highlight connected user's winning NFTs (compare address with wagmi useAccount)
    - Show "Game still in progress" message when no ended game exists
    - Pagination controls using styles.pageBtn / styles.active pattern from stake page
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 13. Frontend: Graveyard pagination fixes
  - [x] 13.1 Fix scroll-to-top in `app/graveyard/page.tsx`
    - Remove `window.scrollTo({ top: 0, behavior: 'smooth' })` from the `goToPage` function
    - _Requirements: 13.1, 13.2_

  - [x] 13.2 Fix pagination CSS classes in `app/graveyard/page.tsx`
    - Replace `styles.btn` / `styles.bo` with `styles.pageBtn` on pagination buttons
    - Replace `styles.br` with `styles.active` on the active page button
    - Match the pagination pattern used in `app/stake/page.tsx`
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 14. Frontend: Stake page game state awareness
  - [x] 14.1 Update Stake page to reflect game state from mst_game
    - Ensure `loadGameState` response includes `isGameComplete` field
    - When `isGameComplete` is true, disable all action buttons (pay tax, claim, enter game)
    - _Requirements: 11.1, 11.3_

- [x] 15. Checkpoint — All implementation complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 16. Write unit tests for Game Session Service
  - Test createGameSession with exact default values (durationDays=60, survivorTarget=500)
  - Test createGameSession rejected when active game exists (409)
  - Test startGameSession with non-existent gameId (404)
  - Test endGameSession with specific endReason values
  - Test isGameLocked with no mst_game records (backward compat — not locked)
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.2, 2.3, 4.4, 10.1_

- [ ]* 17. Write unit tests for Winner Snapshot Service
  - Test createWinnerSnapshot with 0 survivors (empty result)
  - Test createWinnerSnapshot with tied points (deterministic rank ordering)
  - Test getWinners pagination edge cases: page beyond total, limit=1, limit=100
  - Test hasSnapshot returns true after snapshot creation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3_

- [ ]* 18. Write unit tests for auto-registration and graveyard fixes
  - Test autoRegisterNewNFTs with 0 new NFTs (no-op)
  - Test autoRegisterNewNFTs when OpenSea API is down (fail-open, no error thrown)
  - Test graveyard goToPage does not call window.scrollTo
  - Test graveyard pagination uses correct CSS classes (pageBtn, active)
  - _Requirements: 9.1, 9.3, 13.1, 14.1, 14.2_

- [x] 19. Final checkpoint — All tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend services are implemented first since API routes and frontend depend on them
- The game lock mechanism is added to existing routes via a simple import + check pattern
- Auto-registration piggybacks on existing claim/pay-tax flows — no new cron jobs needed
