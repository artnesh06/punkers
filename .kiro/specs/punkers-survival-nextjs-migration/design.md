# Design Document: Punkers Survival Next.js Migration

## Overview

This design outlines the migration of the Punkers Survival game from a standalone HTML application to a modern Next.js 14 application with TypeScript, Prisma ORM, PostgreSQL database, and Ethereum wallet integration. The migration preserves the existing game UI/UX while adding blockchain functionality for NFT ownership tracking (read-only), soft-staking (database-only), and leaderboard systems.

### Goals

- Migrate HTML/CSS/JavaScript game to Next.js 14 with App Router
- Integrate Prisma ORM with existing PostgreSQL database schema
- Implement Ethereum wallet connection using Wagmi/RainbowKit
- Preserve original game aesthetics and user experience
- Add NFT ownership verification (read-only blockchain queries)
- Implement soft-staking functionality (database-only, no blockchain transactions)
- Implement real-time leaderboard with pagination
- Ensure type safety with TypeScript throughout

### Non-Goals

- Modifying the core game mechanics or visual design
- Implementing smart contract staking (using soft-staking approach instead)
- Building admin dashboard (future enhancement)
- Multi-chain support (Ethereum L1 only)

## Architecture

### High-Level Architecture

**Note on Soft-Staking Architecture:**

This design implements a soft-staking approach where staking operations are managed entirely in the database without blockchain transactions. The blockchain service is used only for read-only operations (NFT ownership verification). This approach provides:

- Instant staking/unstaking without gas fees
- No blockchain transaction delays
- Simplified user experience
- Lower operational costs
- Database as the single source of truth for staking state

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js UI Components]
        WC[Wallet Connector]
        SM[State Management]
    end

    subgraph "API Layer"
        AR[API Routes]
        MW[Middleware]
        SR[Staking Routes]
    end

    subgraph "Service Layer"
        BC[Blockchain Service - Read Only]
        DB[Database Service]
        SS[Staking Service]
        PC[Points Calculator]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL)]
        ETH[Ethereum L1 - Read Only]
    end

    UI --> WC
    UI --> SM
    UI --> AR
    UI --> SR
    WC --> BC
    AR --> MW
    AR --> DB
    AR --> PC
    SR --> SS
    SS --> DB
    DB --> PG
    BC -->|Read NFT Ownership| ETH
    PC --> DB
```

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Wagmi v2 + RainbowKit for wallet connection
- **Styling**: CSS Modules (preserving existing styles)
- **Testing**: Jest + React Testing Library
- **Deployment**: Docker + Vercel compatible

### Directory Structure

```
punkers-survival-nextjs/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/
│   │   ├── nft/
│   │   │   └── update-owner/route.ts
│   │   ├── staking/
│   │   │   ├── stake/route.ts
│   │   │   └── unstake/route.ts
│   │   ├── points/
│   │   │   └── total/route.ts
│   │   ├── leaderboard/route.ts
│   │   └── health/route.ts
│   ├── gallery/page.tsx
│   ├── rules/page.tsx
│   ├── stake/page.tsx
│   ├── survival/page.tsx
│   ├── graveyard/page.tsx
│   ├── treasury/page.tsx
│   └── ranks/page.tsx
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Ticker.tsx
│   │   └── Footer.tsx
│   ├── wallet/
│   │   └── WalletButton.tsx
│   ├── game/
│   │   ├── NFTCard.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Modal.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Toast.tsx
├── lib/
│   ├── prisma.ts
│   ├── wagmi.ts
│   ├── blockchain/
│   │   ├── nft-service.ts
│   │   └── contract-abi.ts
│   ├── services/
│   │   ├── staking-service.ts
│   │   ├── points-calculator.ts
│   │   └── leaderboard-service.ts
│   └── utils/
│       ├── validation.ts
│       └── retry.ts
├── types/
│   ├── database.ts
│   ├── nft.ts
│   └── api.ts
├── prisma/
│   └── schema.prisma
├── styles/
│   ├── globals.css
│   └── game.module.css
└── tests/
    ├── unit/
    └── integration/
```

## Components and Interfaces

### Core Components

#### 1. Layout Components

**Navbar Component**

- Displays navigation links (Gallery, Rules, Stake, Survival, Graveyard, Treasury, Ranks)
- Integrates WalletButton for connection status
- Responsive hamburger menu for mobile
- Active state management for current page

**Ticker Component**

- Scrolling advertisement banner
- Infinite loop animation
- Displays recent transactions/activities

**Footer Component**

- Static footer with copyright and links

#### 2. Wallet Components

**WalletButton Component**

```typescript
interface WalletButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

// States: disconnected, connecting, connected
// Displays: "CONNECT" | "Connecting..." | "0xAb3...d9F"
```

#### 3. Game Components

**NFTCard Component**

```typescript
interface NFTCardProps {
  tokenId: string;
  imageUrl: string;
  isStaked: boolean;
  isDead: boolean;
  attributes: NFTAttribute[];
  estimatedPoints: number;
  onStake?: () => Promise<void>;
  onUnstake?: () => Promise<void>;
}
```

**Behavior:**
- Displays NFT image, attributes, and staking status
- onStake/onUnstake handlers call API endpoints (POST /api/staking/stake or /api/staking/unstake)
- No blockchain transactions - all operations are database updates
- Shows loading state during API calls
- Updates UI immediately after successful database update

**StatsPanel Component**

```typescript
interface StatsPanelProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'danger' | 'success';
}
```

**ProgressBar Component**

```typescript
interface ProgressBarProps {
  current: number;
  max: number;
  label: string;
}
```

**Modal Component**

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
```

#### 4. UI Components

**Button Component**

```typescript
interface ButtonProps {
  variant: 'red' | 'green' | 'outline' | 'gold';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Toast Component**

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}
```

### Service Layer Interfaces

#### Blockchain Service

```typescript
interface NFTService {
  // Get NFTs owned by address (read-only)
  getNFTsByOwner(address: string): Promise<NFT[]>;

  // Get NFT metadata (read-only)
  getNFTMetadata(tokenId: string): Promise<NFTMetadata>;
}

interface NFT {
  tokenId: string;
  contractAddress: string;
  owner: string;
  metadata: NFTMetadata;
}

interface NFTMetadata {
  name: string;
  image: string;
  attributes: NFTAttribute[];
}

interface NFTAttribute {
  trait_type: string;
  value: string | number;
}
```

#### Staking Service

```typescript
interface StakingService {
  // Get staking status from database
  getStakingStatus(address: string, tokenId: string): Promise<StakingStatus>;

  // Stake NFT (database update only)
  stakeNFT(address: string, tokenId: string): Promise<StakingResult>;

  // Unstake NFT (database update only)
  unstakeNFT(address: string, tokenId: string): Promise<StakingResult>;

  // Get all staked NFTs for address
  getStakedNFTs(address: string): Promise<StakedNFT[]>;
}

interface StakingStatus {
  isStaked: boolean;
  stakedAt?: Date;
  unstakedAt?: Date;
  estimatedPoints: number;
}

interface StakingResult {
  success: boolean;
  message?: string;
  staker?: Staker;
}

interface StakedNFT {
  tokenId: string;
  collectionId: string;
  stakedAt: Date;
  estimatedPoints: number;
}
```

#### Database Service

```typescript
interface DatabaseService {
  // User operations
  getUserByAddress(address: string): Promise<User | null>;
  createUser(address: string): Promise<User>;
  updateUserPoints(address: string, points: number): Promise<void>;

  // Staker operations
  getStakersByAddress(address: string): Promise<Staker[]>;
  updateStaker(data: UpdateStakerInput): Promise<Staker>;
  stakeNFT(userId: string, collectionId: string, tokenId: string): Promise<Staker>;
  unstakeNFT(userId: string, collectionId: string, tokenId: string): Promise<Staker>;

  // Leaderboard operations
  getLeaderboard(page: number, limit: number): Promise<LeaderboardEntry[]>;

  // Points operations
  getPointTransactions(address: string): Promise<PointTransaction[]>;
  createPointTransaction(
    data: CreatePointTransactionInput
  ): Promise<PointTransaction>;
}
```

#### Points Calculator Service

```typescript
interface PointsCalculator {
  // Calculate total points for an address
  calculateTotalPoints(address: string): Promise<number>;

  // Calculate points for specific NFT
  calculateNFTPoints(
    tokenId: string,
    attributes: NFTAttribute[]
  ): Promise<number>;

  // Calculate attribute bonus
  calculateAttributeBonus(attributes: NFTAttribute[]): Promise<number>;
}
```

### API Route Interfaces

#### POST /api/nft/update-owner

```typescript
// Request
interface UpdateOwnerRequest {
  address: string;
}

// Response
interface UpdateOwnerResponse {
  success: boolean;
  updatedCount: number;
  message?: string;
}
```

#### GET /api/points/total

```typescript
// Query params
interface TotalPointsQuery {
  address: string;
}

// Response
interface TotalPointsResponse {
  address: string;
  totalPoints: number;
  breakdown: {
    nftPoints: number;
    attributeBonus: number;
    transactionPoints: number;
  };
}
```

#### GET /api/leaderboard

```typescript
// Query params
interface LeaderboardQuery {
  page?: number; // default: 1
  limit?: number; // default: 50
}

// Response
interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEntries: number;
    hasMore: boolean;
  };
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  nftCount: number;
}
```

#### POST /api/staking/stake

```typescript
// Request
interface StakeRequest {
  address: string;
  tokenId: string;
}

// Response
interface StakeResponse {
  success: boolean;
  message?: string;
  staker?: {
    id: string;
    tokenId: string;
    isStaked: boolean;
    stakedAt: Date;
  };
}
```

#### POST /api/staking/unstake

```typescript
// Request
interface UnstakeRequest {
  address: string;
  tokenId: string;
}

// Response
interface UnstakeResponse {
  success: boolean;
  message?: string;
  staker?: {
    id: string;
    tokenId: string;
    isStaked: boolean;
    unstakedAt: Date;
  };
}
```

## Data Models

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model mst_users {
  id        String   @id @default(uuid())
  address   String   @unique
  discord   String?
  twitter   String?
  points    Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stakers       mst_staker[]
  transactions  trn_point[]
  participants  trn_participant[]

  @@map("mst_users")
}

model mst_project {
  id          String   @id @default(uuid())
  name        String
  leaderboard Boolean  @default(true)
  banner      String?
  twitter     String?
  discord     String?
  website     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  collections mst_collection[]

  @@map("mst_project")
}

model mst_collection {
  id              String   @id @default(uuid())
  projectId       String
  contractAddress String   @unique
  name            String
  symbol          String?
  totalSupply     Int?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project    mst_project @relation(fields: [projectId], references: [id])
  rewards    mst_reward[]
  stakers    mst_staker[]
  attributes mst_attributes_reward[]

  @@map("mst_collection")
}

model mst_reward {
  id           String   @id @default(uuid())
  collectionId String
  tokenId      String
  pointsPerDay Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  collection mst_collection @relation(fields: [collectionId], references: [id])

  @@unique([collectionId, tokenId])
  @@map("mst_reward")
}

model mst_staker {
  id           String    @id @default(uuid())
  userId       String
  collectionId String
  tokenId      String
  isStaked     Boolean   @default(false)
  stakedAt     DateTime?
  unstakedAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user       mst_users      @relation(fields: [userId], references: [id])
  collection mst_collection @relation(fields: [collectionId], references: [id])

  @@unique([collectionId, tokenId])
  @@map("mst_staker")
}

model mst_attributes_reward {
  id           String   @id @default(uuid())
  collectionId String
  traitType    String
  traitValue   String
  bonusPoints  Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  collection mst_collection @relation(fields: [collectionId], references: [id])

  @@unique([collectionId, traitType, traitValue])
  @@map("mst_attributes_reward")
}

model trn_point {
  id          String   @id @default(uuid())
  userId      String
  points      Int
  description String?
  type        String   // 'stake', 'unstake', 'bonus', 'penalty'
  createdAt   DateTime @default(now())

  user mst_users @relation(fields: [userId], references: [id])

  @@map("trn_point")
}

model trn_participant {
  id        String   @id @default(uuid())
  userId    String
  eventType String
  metadata  Json?
  createdAt DateTime @default(now())

  user mst_users @relation(fields: [userId], references: [id])

  @@map("trn_participant")
}
```

### Type Definitions

```typescript
// types/database.ts
export type User = {
  id: string;
  address: string;
  discord: string | null;
  twitter: string | null;
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
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

- Properties 5.2, 6.3, and 6.4 (NFT ownership updates) can be combined into a single comprehensive property about NFT data synchronization
- Properties 9.4 and 9.6 (staking/unstaking database updates) are essentially the same pattern and can be combined
- Properties 7.2, 7.3, 7.4, 7.5 (points calculation steps) can be consolidated into one property about the complete calculation
- Properties 5.8 and 5.9 (validation and error responses) can be combined into one property about input validation
- Properties 11.1 and 11.2 (logging) can be combined into a comprehensive logging property

### Property 1: Prisma Client Singleton

_For any_ sequence of calls to get the Prisma client instance, all calls should return the same object reference, ensuring connection pooling works correctly.

**Validates: Requirements 2.10**

### Property 2: Address Display Shortening

_For any_ valid Ethereum address, when displayed in the UI after wallet connection, the displayed string should be a shortened version in the format "0xABC...XYZ" where the full address is preserved in the underlying state.

**Validates: Requirements 3.4**

### Property 3: Wallet State Persistence

_For any_ valid Ethereum address, after successful wallet connection, querying the state management should return that exact address.

**Validates: Requirements 3.7**

### Property 4: Wallet Disconnect Cleanup

_For any_ connected wallet state, calling disconnect should clear the address from state management and reset the UI to the disconnected state.

**Validates: Requirements 3.8**

### Property 5: NFT Ownership Synchronization

_For any_ valid Ethereum address and collection, calling updateNftOwner should query the blockchain for all NFTs owned by that address across all supported collections and update the mst_staker table to reflect current ownership.

**Validates: Requirements 5.2, 6.2, 6.3, 6.4**

### Property 6: Points Calculation Completeness

_For any_ valid address, calculating total points should sum all points from: (1) staked NFTs base points, (2) attribute bonuses from mst_attributes_reward, and (3) transaction history from trn_point, returning a non-negative number.

**Validates: Requirements 5.4, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7**

### Property 7: Leaderboard Ordering

_For any_ set of users with points, the leaderboard should return entries ordered by points in descending order, with each entry containing rank, address, points, and NFT count.

**Validates: Requirements 8.1, 8.2**

### Property 8: Pagination Consistency

_For any_ valid page number and limit, the leaderboard API should return exactly `limit` entries (or fewer on the last page) with correct pagination metadata including currentPage, totalPages, totalEntries, and hasMore flag.

**Validates: Requirements 5.6, 5.7, 8.3**

### Property 9: Input Validation and Error Responses

_For any_ API endpoint, when called with invalid parameters, the endpoint should validate inputs before processing and return a 400 status code with a descriptive error message.

**Validates: Requirements 5.8, 5.9**

### Property 10: Blockchain Retry Mechanism

_For any_ blockchain query that fails, the system should retry the operation up to 3 times before returning a failure status.

**Validates: Requirements 6.5**

### Property 11: Staking State Synchronization

_For any_ NFT, when a staking or unstaking operation succeeds in the database, the mst_staker table should be updated to reflect the new staking status (isStaked, stakedAt/unstakedAt timestamps).

**Validates: Requirements 9.3, 9.4**

### Property 12: NFT Display Completeness

_For any_ user address, the staking interface should display all NFTs owned by that address with their current staking status and estimated points per day.

**Validates: Requirements 9.1, 9.2, 9.7**

### Property 13: Comprehensive Logging

_For any_ API request or error, the system should create log entries containing: (1) timestamp, (2) endpoint/operation, (3) for errors: error message, stack trace, and context, (4) no sensitive information (private keys, full database credentials).

**Validates: Requirements 11.1, 11.2, 11.4**

### Property 14: Network Error Retry

_For any_ network operation that fails due to network errors (timeout, connection refused), the system should implement a retry mechanism with exponential backoff before failing.

**Validates: Requirements 11.5**

### Property 15: API Response Caching

_For any_ cacheable API endpoint, repeated identical requests within the cache TTL should return cached data without hitting the database, and the cache should be invalidated when underlying data changes.

**Validates: Requirements 12.4**

## Error Handling

### Error Categories

#### 1. Validation Errors (400)

- Invalid Ethereum addresses
- Missing required parameters
- Invalid pagination parameters (page < 1, limit < 1 or > 100)
- Invalid token IDs

**Handling Strategy:**

- Validate at API route entry point
- Return structured error response with field-level details
- Log validation failures at INFO level

```typescript
interface ValidationError {
  statusCode: 400;
  error: 'Validation Error';
  message: string;
  fields?: Record<string, string>;
}
```

#### 2. Authentication Errors (401)

- Wallet not connected
- Invalid signature
- Expired session

**Handling Strategy:**

- Check wallet connection state before operations
- Return clear authentication error
- Redirect to wallet connection flow

#### 3. Authorization Errors (403)

- User attempting to stake NFT they don't own
- Accessing other user's private data

**Handling Strategy:**

- Verify ownership before operations
- Return forbidden error without exposing system details

#### 4. Not Found Errors (404)

- NFT not found
- User not found
- Collection not found

**Handling Strategy:**

- Check existence before operations
- Return specific not found message
- Log at INFO level

#### 5. Blockchain Errors (502/503)

- RPC node unavailable
- NFT ownership query failed
- Network congestion

**Handling Strategy:**

- Implement retry with exponential backoff (3 attempts)
- Return user-friendly message about blockchain issues
- Log full error details at ERROR level
- Only applies to read-only operations (NFT ownership queries)

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### 6. Database Errors (500)

- Connection pool exhausted
- Query timeout
- Constraint violations
- Staking operation failures

**Handling Strategy:**

- Catch at service layer
- Return generic 500 error to client
- Log full error with stack trace at ERROR level
- Alert monitoring system for critical errors
- For staking operations: rollback any partial updates

```typescript
try {
  // Database operation
} catch (error) {
  logger.error('Database operation failed', {
    operation: 'stakeNFT',
    error: error.message,
    stack: error.stack,
    context: { userId, tokenId },
  });

  throw new DatabaseError('Failed to update staking status');
}
```

#### 7. Rate Limiting (429)

- Too many requests from single address
- API quota exceeded

**Handling Strategy:**

- Implement rate limiting middleware
- Return retry-after header
- Log at WARN level

### Error Logging Strategy

```typescript
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
}
```

**Log Levels:**

- INFO: Successful operations, validation failures
- WARN: Retries, rate limiting, deprecated API usage
- ERROR: Failed operations, blockchain errors, database errors
- FATAL: System-wide failures, startup errors

**Sensitive Data Filtering:**

- Remove private keys from logs
- Mask database credentials
- Truncate large payloads
- Hash user addresses in non-production environments

### Fallback UI Strategy

For critical errors that prevent normal operation:

1. **Database Connection Failure:**
   - Display maintenance page
   - Show estimated recovery time
   - Provide status page link

2. **Blockchain RPC Failure:**
   - Display cached data with warning banner
   - Disable NFT ownership refresh operations
   - Show "Read-only mode" indicator
   - Staking operations continue to work (database-only)

3. **Wallet Connection Failure:**
   - Show troubleshooting steps
   - Link to wallet provider documentation
   - Suggest alternative wallets

## Testing Strategy

### Dual Testing Approach

This project requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs through randomization

### Property-Based Testing Configuration

**Library:** fast-check (TypeScript property-based testing library)

**Configuration:**

- Minimum 100 iterations per property test
- Seed-based reproducibility for failed tests
- Shrinking enabled to find minimal failing cases

**Test Tagging Format:**

```typescript
// Feature: punkers-survival-nextjs-migration, Property 1: Prisma Client Singleton
test('prisma client returns same instance', async () => {
  await fc.assert(
    fc.asyncProperty(fc.nat(10), async (callCount) => {
      const instances = [];
      for (let i = 0; i < callCount; i++) {
        instances.push(getPrismaClient());
      }
      // All instances should be the same reference
      return instances.every((inst) => inst === instances[0]);
    }),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

#### API Routes Testing

```typescript
describe('POST /api/nft/update-owner', () => {
  it('should update NFT ownership for valid address', async () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const response = await fetch('/api/nft/update-owner', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should return 400 for invalid address', async () => {
    const response = await fetch('/api/nft/update-owner', {
      method: 'POST',
      body: JSON.stringify({ address: 'invalid' }),
    });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/staking/stake', () => {
  it('should stake NFT and update database', async () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const tokenId = '1234';
    const response = await fetch('/api/staking/stake', {
      method: 'POST',
      body: JSON.stringify({ address, tokenId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.staker.isStaked).toBe(true);
    expect(data.staker.stakedAt).toBeDefined();
  });

  it('should return 400 for missing parameters', async () => {
    const response = await fetch('/api/staking/stake', {
      method: 'POST',
      body: JSON.stringify({ address: '0x123' }),
    });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/staking/unstake', () => {
  it('should unstake NFT and update database', async () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const tokenId = '1234';
    const response = await fetch('/api/staking/unstake', {
      method: 'POST',
      body: JSON.stringify({ address, tokenId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.staker.isStaked).toBe(false);
    expect(data.staker.unstakedAt).toBeDefined();
  });
});
```

#### Component Testing

```typescript
describe('WalletButton', () => {
  it('should display "CONNECT" when disconnected', () => {
    render(<WalletButton />);
    expect(screen.getByText('CONNECT')).toBeInTheDocument();
  });

  it('should display shortened address when connected', () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    render(<WalletButton address={address} />);
    expect(screen.getByText(/0x742...bEb/)).toBeInTheDocument();
  });
});
```

#### Service Layer Testing

```typescript
describe('PointsCalculator', () => {
  it('should return 0 for address with no NFTs', async () => {
    const points = await calculateTotalPoints(
      '0x9b2c7964da7b986b08862ba5903ed994e57efcc7'
    );
    expect(points).toBe(0);
  });

  it('should sum NFT points and attribute bonuses', async () => {
    // Setup test data
    const points = await calculateTotalPoints(testAddress);
    expect(points).toBeGreaterThan(0);
  });
});

describe('StakingService', () => {
  it('should stake NFT and update database only', async () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const tokenId = '1234';
    
    const result = await stakeNFT(address, tokenId);
    
    expect(result.success).toBe(true);
    expect(result.staker.isStaked).toBe(true);
    expect(result.staker.stakedAt).toBeDefined();
    
    // Verify no blockchain transaction was created
    expect(mockBlockchainService.stakeNFT).not.toHaveBeenCalled();
  });

  it('should unstake NFT and update database only', async () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const tokenId = '1234';
    
    const result = await unstakeNFT(address, tokenId);
    
    expect(result.success).toBe(true);
    expect(result.staker.isStaked).toBe(false);
    expect(result.staker.unstakedAt).toBeDefined();
    
    // Verify no blockchain transaction was created
    expect(mockBlockchainService.unstakeNFT).not.toHaveBeenCalled();
  });

  it('should get staking status from database', async () => {
    const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const tokenId = '1234';
    
    const status = await getStakingStatus(address, tokenId);
    
    expect(status.isStaked).toBeDefined();
    expect(status.estimatedPoints).toBeGreaterThanOrEqual(0);
  });
});
```

### Property-Based Test Examples

#### Property 1: Prisma Client Singleton

```typescript
// Feature: punkers-survival-nextjs-migration, Property 1: Prisma Client Singleton
test('prisma client singleton property', async () => {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 1, max: 100 }), async (numCalls) => {
      const clients = Array.from({ length: numCalls }, () => getPrismaClient());
      const firstClient = clients[0];
      return clients.every((client) => client === firstClient);
    }),
    { numRuns: 100 }
  );
});
```

#### Property 2: Address Display Shortening

```typescript
// Feature: punkers-survival-nextjs-migration, Property 2: Address Display Shortening
test('address shortening property', () => {
  fc.assert(
    fc.property(fc.hexaString({ minLength: 40, maxLength: 40 }), (hex) => {
      const address = `0x${hex}`;
      const shortened = shortenAddress(address);

      // Should start with 0x and first 3 chars
      expect(shortened).toMatch(/^0x[0-9a-fA-F]{3}\.\.\.[0-9a-fA-F]{3}$/);

      // Should contain parts of original address
      expect(shortened.startsWith(address.slice(0, 5))).toBe(true);
      expect(shortened.endsWith(address.slice(-3))).toBe(true);

      return true;
    }),
    { numRuns: 100 }
  );
});
```

#### Property 6: Points Calculation Non-Negative

```typescript
// Feature: punkers-survival-nextjs-migration, Property 6: Points Calculation Completeness
test('points calculation always non-negative', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.hexaString({ minLength: 40, maxLength: 40 }),
      async (hex) => {
        const address = `0x${hex}`;
        const points = await calculateTotalPoints(address);
        return points >= 0;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 7: Leaderboard Ordering

```typescript
// Feature: punkers-survival-nextjs-migration, Property 7: Leaderboard Ordering
test('leaderboard ordering property', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 1, max: 10 }),
      fc.integer({ min: 10, max: 100 }),
      async (page, limit) => {
        const response = await fetch(
          `/api/leaderboard?page=${page}&limit=${limit}`
        );
        const data = await response.json();

        // Check ordering
        for (let i = 0; i < data.entries.length - 1; i++) {
          if (data.entries[i].points < data.entries[i + 1].points) {
            return false;
          }
        }

        // Check rank assignment
        for (let i = 0; i < data.entries.length; i++) {
          if (data.entries[i].rank !== (page - 1) * limit + i + 1) {
            return false;
          }
        }

        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 9: Input Validation

```typescript
// Feature: punkers-survival-nextjs-migration, Property 9: Input Validation and Error Responses
test('invalid inputs return 400', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.oneof(
        fc.constant(''),
        fc.constant('not-an-address'),
        fc.constant('0x123'), // too short
        fc.string() // random string
      ),
      async (invalidAddress) => {
        const response = await fetch('/api/nft/update-owner', {
          method: 'POST',
          body: JSON.stringify({ address: invalidAddress }),
        });

        return response.status === 400;
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property 11: Staking State Synchronization

```typescript
// Feature: punkers-survival-nextjs-migration, Property 11: Staking State Synchronization
test('staking updates database without blockchain transaction', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.hexaString({ minLength: 40, maxLength: 40 }),
      fc.integer({ min: 1, max: 10000 }),
      async (hex, tokenId) => {
        const address = `0x${hex}`;
        
        // Stake NFT
        const stakeResponse = await fetch('/api/staking/stake', {
          method: 'POST',
          body: JSON.stringify({ address, tokenId: tokenId.toString() }),
        });
        
        if (stakeResponse.status !== 200) return true; // Skip invalid cases
        
        const stakeData = await stakeResponse.json();
        
        // Verify database was updated
        expect(stakeData.success).toBe(true);
        expect(stakeData.staker.isStaked).toBe(true);
        expect(stakeData.staker.stakedAt).toBeDefined();
        
        // Verify no blockchain transaction was created
        expect(mockBlockchainService.stakeNFT).not.toHaveBeenCalled();
        
        return true;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Goals

- **API Routes**: 80% coverage
- **Service Layer**: 90% coverage
- **Utility Functions**: 95% coverage
- **React Components**: 70% coverage
- **Overall**: 75% minimum

### Integration Testing

Test complete user flows:

1. **Wallet Connection Flow:**
   - Connect wallet → Display address → Disconnect → Verify state cleared

2. **NFT Staking Flow:**
   - Connect wallet → View NFTs → Stake NFT → Verify database update → Check points increase → Unstake NFT → Verify database update

3. **Leaderboard Flow:**
   - Load leaderboard → Paginate → Verify user highlight → Check auto-refresh

4. **Soft-Staking Flow:**
   - Verify no blockchain transactions for staking
   - Test database-only staking operations
   - Verify immediate UI updates after database changes

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit

      - name: Run property tests
        run: npm run test:property

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```
