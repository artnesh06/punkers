# Services Layer

This directory contains service modules that implement business logic for the Punkers Survival application.

## Staking Service (staking-service.ts)

**Soft-Staking Implementation**

The staking service implements a soft-staking approach where all staking operations are managed entirely in the database without blockchain transactions. This provides:

- **Instant staking/unstaking** - No waiting for blockchain confirmations
- **No gas fees** - All operations are free for users
- **Simplified UX** - Users don't need to sign transactions
- **Lower costs** - No blockchain transaction fees
- **Database as source of truth** - Staking state managed in PostgreSQL

### Functions

#### `getStakingStatus(address: string, tokenId: string): Promise<StakingStatus>`
Get the current staking status for an NFT from the database.

#### `stakeNFT(address: string, tokenId: string): Promise<StakingResult>`
Stake an NFT by updating the database record. Sets `isStaked=true` and `stakedAt=now()`.

#### `unstakeNFT(address: string, tokenId: string): Promise<StakingResult>`
Unstake an NFT by updating the database record. Sets `isStaked=false` and `unstakedAt=now()`.

#### `getStakedNFTs(address: string): Promise<StakedNFT[]>`
Get all staked NFTs for a user address.

### Important Notes

- **No blockchain transactions**: All operations update the database only
- **Ownership verification**: NFT ownership is still verified from blockchain (read-only)
- **Points calculation**: Based on database staking records, not blockchain state
- **Instant updates**: UI updates immediately after database changes

## Database Service (database-service.ts)

Handles all database operations using Prisma ORM.

## Points Calculator (points-calculator.ts)

Calculates user points based on staked NFTs, attributes, and transaction history.

## Leaderboard Service (leaderboard-service.ts)

Manages leaderboard queries with pagination and ranking.
