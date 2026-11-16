# Requirements Document

## Introduction

This document specifies the requirements for completing the PUNKERS NFT survival game system. The game is a 60-day survival competition where 5000 NFTs enter and 500 survive. The existing codebase has staking, tax payment, execution/kill, bounty hunting, leaderboard, graveyard, and survival pages. This spec covers the missing pieces: game session management (mst_game), winner snapshot system (mst_winner), the "Enter Game" participant model with auto-registration of new NFTs, game end/lock flow, and UI bug fixes on the graveyard page.

## Glossary

- **Game_Session_Service**: Backend service that manages mst_game records — creating, starting, ending, and querying active game sessions
- **Winner_Snapshot_Service**: Backend service that snapshots all surviving NFTs as winners when a game ends, writing to the mst_winner table
- **Game_State_Service**: Existing service (game-state-service.ts) that returns current game day, tax rate, alive/dead counts, and game completion status
- **Staking_Service**: Existing service (staking-service.ts) that handles NFT staking, status queries, and game mechanics calculations
- **Admin_API**: API endpoints protected by admin API key authentication (requireAdmin middleware) for game management operations
- **Participant**: A user who has clicked "ENTER GAME" — all current and future NFTs in their wallet are automatically registered in the game
- **Auto_Registration**: The process of detecting new NFTs in a participant's wallet during claim or pay-tax actions and automatically staking them
- **Game_Lock**: The state where all game actions (staking, claiming, tax payment, execution) are blocked because the game has ended
- **Graveyard_Page**: The existing page (app/graveyard/page.tsx) that displays dead NFTs with global and personal views
- **Stake_Page**: The existing page (app/stake/page.tsx) with the ENTER GAME button and NFT card grid
- **Winners_Page**: A new page or section that displays the ranked list of surviving NFTs after a game ends
- **mst_game**: Prisma model for game sessions with season, name, dates, duration, survivor target, schedules, and status
- **mst_winner**: Prisma model for winner snapshots with gameId, userId, address, tokenId, rank, totalPoints, rarity, survivedDays
- **$PUNK**: The in-game points currency used for earnings, tax payments, and bounty rewards

## Requirements

### Requirement 1: Create Game Session

**User Story:** As an admin, I want to create a new game session, so that I can configure and launch a new season of the survival game.

#### Acceptance Criteria

1. WHEN an admin sends a POST request to the game session endpoint with season, name, startDate, durationDays, and survivorTarget, THE Admin_API SHALL create a new mst_game record with status "pending" and return the created game session
2. IF the request is missing required fields (season, name, startDate), THEN THE Admin_API SHALL return a 400 error with a descriptive message
3. THE Admin_API SHALL default durationDays to 60 and survivorTarget to 500 when those fields are not provided
4. THE Admin_API SHALL store the TAX_SCHEDULE and EARNING_SCHEDULE from game-engine.ts as JSON in the taxSchedule and earnSchedule fields of the mst_game record
5. IF a game session with status "active" already exists, THEN THE Admin_API SHALL reject creation of a new game session with a 409 conflict error

### Requirement 2: Start Game Session

**User Story:** As an admin, I want to start a pending game session, so that the survival game begins and players can participate.

#### Acceptance Criteria

1. WHEN an admin sends a POST request to start a game session with a valid gameId, THE Admin_API SHALL update the mst_game status from "pending" to "active" and set the startDate to the current timestamp
2. IF the specified game session does not exist, THEN THE Admin_API SHALL return a 404 error
3. IF the specified game session status is not "pending", THEN THE Admin_API SHALL return a 400 error indicating the game cannot be started
4. WHEN a game session is started, THE Admin_API SHALL also update the existing gameState record's gameStartDate to match the mst_game startDate and set isActive to true

### Requirement 3: Get Active Game Session

**User Story:** As a player, I want to see the current active game session details, so that I know the season, duration, and survivor target.

#### Acceptance Criteria

1. WHEN a GET request is made to the active game endpoint, THE Game_Session_Service SHALL return the mst_game record with status "active", or null if no active game exists
2. THE Game_Session_Service SHALL include computed fields: currentGameDay (calculated from startDate), currentTaxRate, and survivorsRemaining (count of alive staked NFTs)
3. WHILE no active game session exists in mst_game, THE Game_State_Service SHALL fall back to the existing gameState table for backward compatibility

### Requirement 4: End Game Session

**User Story:** As an admin, I want to manually end a game session, so that I can trigger the winner snapshot and lock the game.

#### Acceptance Criteria

1. WHEN an admin sends a POST request to end a game session with a valid gameId, THE Admin_API SHALL update the mst_game status to "ended", set endedAt to the current timestamp, and set endReason to "manual"
2. WHEN a game session is ended, THE Admin_API SHALL trigger the Winner_Snapshot_Service to snapshot all surviving NFTs
3. WHEN a game session is ended, THE Admin_API SHALL update the mst_game totalParticipants, totalSurvivors, and totalDead counts from the current staker data
4. IF the specified game session status is not "active", THEN THE Admin_API SHALL return a 400 error indicating the game cannot be ended

### Requirement 5: Automatic Game End Detection

**User Story:** As a system operator, I want the game to automatically detect end conditions, so that the game ends without manual intervention when conditions are met.

#### Acceptance Criteria

1. WHEN the Game_State_Service calculates isGameComplete as true (survivors <= 500 OR currentGameDay > 60), THE Game_State_Service SHALL check if the active mst_game session is still "active" and trigger the end-game flow
2. WHEN the end condition is "survivors <= survivorTarget", THE Game_Session_Service SHALL set the endReason to "survivor_target_reached"
3. WHEN the end condition is "currentGameDay > durationDays", THE Game_Session_Service SHALL set the endReason to "duration_ended"
4. THE Game_State_Service SHALL perform the end-game check on every call to getGameState() to ensure timely detection

### Requirement 6: Winner Snapshot Creation

**User Story:** As a player, I want surviving NFTs to be recorded as winners when the game ends, so that winners are permanently preserved with their ranks.

#### Acceptance Criteria

1. WHEN the game ends, THE Winner_Snapshot_Service SHALL query all mst_staker records where isStaked is true and isDead is false
2. THE Winner_Snapshot_Service SHALL rank surviving NFTs by total accumulated points in descending order
3. FOR EACH surviving NFT, THE Winner_Snapshot_Service SHALL create a mst_winner record with gameId, userId, address, tokenId, rank, totalPoints, rarity (from determineNFTRarity), and survivedDays (calculated from stakedAt to endedAt)
4. IF a winner snapshot already exists for the given gameId, THEN THE Winner_Snapshot_Service SHALL skip creation and return the existing snapshot to prevent duplicate snapshots

### Requirement 7: Get Winners List

**User Story:** As a player, I want to view the winners of a completed game, so that I can see who survived and their rankings.

#### Acceptance Criteria

1. WHEN a GET request is made to the winners endpoint with a gameId, THE Admin_API SHALL return the list of mst_winner records ordered by rank ascending
2. THE Admin_API SHALL support pagination with page and limit query parameters, defaulting to page 1 and limit 50
3. THE Admin_API SHALL return the total count of winners alongside the paginated results
4. IF the specified gameId does not exist or the game has not ended, THEN THE Admin_API SHALL return a 404 error


### Requirement 8: Enter Game — One-Click Participant Registration

**User Story:** As a player, I want to click "ENTER GAME" once to register as a participant, so that all my current and future NFTs are automatically in the game without individual staking.

#### Acceptance Criteria

1. WHEN a player clicks "ENTER GAME", THE Staking_Service SHALL call the existing stake-all endpoint with all NFT tokenIds currently in the player's wallet
2. WHEN the stake-all operation completes, THE Stake_Page SHALL mark the user as a participant and hide the "ENTER GAME" button
3. WHILE a user is a participant (has at least one staked NFT), THE Stake_Page SHALL display all wallet NFTs as "in-game" regardless of whether each individual NFT has a staker record
4. THE Stake_Page SHALL determine participant status by checking if the staking status API returns at least one staked NFT for the connected address

### Requirement 9: Auto-Registration of New NFTs for Participants

**User Story:** As a participant, I want newly acquired NFTs to be automatically registered in the game, so that I do not need to manually stake each new NFT.

#### Acceptance Criteria

1. WHEN a participant calls the claim endpoint for any staked NFT, THE Staking_Service SHALL detect NFTs in the wallet that are not yet in the mst_staker table and create staker records for each new NFT
2. WHEN a participant calls the pay-tax endpoint for any staked NFT, THE Staking_Service SHALL detect NFTs in the wallet that are not yet in the mst_staker table and create staker records for each new NFT
3. THE Staking_Service SHALL use the existing verifyNFTOwnership pattern (OpenSea API) to fetch the participant's current NFT list for auto-registration
4. THE Staking_Service SHALL set stakedAt, lastTaxPayment, and lastClaimDate to the current timestamp for each auto-registered NFT, matching the behavior of the existing stakeNFT function

### Requirement 10: Game Lock After Game Ends

**User Story:** As a system operator, I want all game actions to be blocked after the game ends, so that no further staking, claiming, tax payment, or execution can occur.

#### Acceptance Criteria

1. WHILE the active game session status is "ended", THE Staking_Service SHALL reject all stake requests with a message "Game has ended"
2. WHILE the active game session status is "ended", THE claim endpoint SHALL reject all claim requests with a message "Game has ended"
3. WHILE the active game session status is "ended", THE pay-tax endpoint SHALL reject all tax payment requests with a message "Game has ended"
4. WHILE the active game session status is "ended", THE kill endpoint SHALL reject all execution requests with a message "Game has ended"
5. WHILE the active game session status is "ended", THE stake-all endpoint SHALL reject all stake-all requests with a message "Game has ended"

### Requirement 11: Game End Announcement on Frontend

**User Story:** As a player, I want to see a winner announcement when the game ends, so that I know the game is over and can view the results.

#### Acceptance Criteria

1. WHEN the game state API returns isGameComplete as true, THE Stake_Page SHALL display a "GAME OVER" banner with a link to the winners list
2. WHEN the game state API returns isGameComplete as true, THE Survival_Page SHALL display a "GAME OVER" banner replacing the bounty hunting section
3. WHEN the game state API returns isGameComplete as true, THE Stake_Page SHALL hide the "ENTER GAME" button and all tax/claim action buttons

### Requirement 12: Winners Display Page

**User Story:** As a player, I want a dedicated winners section, so that I can see the ranked list of surviving NFTs after the game ends.

#### Acceptance Criteria

1. THE Winners_Page SHALL display a ranked list of surviving NFTs with rank, address (shortened), tokenId, totalPoints, rarity, and survivedDays
2. THE Winners_Page SHALL highlight the connected user's winning NFTs with a distinct visual style
3. THE Winners_Page SHALL support pagination with page navigation controls
4. WHEN no game has ended yet, THE Winners_Page SHALL display a message indicating the game is still in progress

### Requirement 13: Graveyard Page Pagination Fix — Remove Scroll-to-Top

**User Story:** As a player, I want pagination on the graveyard page to not scroll to the top of the page, so that I can browse dead NFTs without losing my scroll position.

#### Acceptance Criteria

1. WHEN a user clicks a pagination button on the Graveyard_Page, THE Graveyard_Page SHALL change the page without calling window.scrollTo
2. THE Graveyard_Page SHALL retain the user's current scroll position when navigating between pages

### Requirement 14: Graveyard Page Pagination CSS Fix

**User Story:** As a player, I want the graveyard pagination buttons to use the correct CSS classes, so that they match the styling of pagination on other pages.

#### Acceptance Criteria

1. THE Graveyard_Page pagination buttons SHALL use the styles.pageBtn CSS class instead of the styles.btn and styles.bo classes
2. THE Graveyard_Page active page button SHALL use the styles.active CSS class instead of the styles.br class
3. THE Graveyard_Page pagination styling SHALL match the pagination styling used on the Stake_Page
