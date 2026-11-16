# Punkers Survival - Next.js Migration

A modern Next.js 14 application for the Punkers Survival NFT staking game with Ethereum wallet integration.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Wagmi v2 + RainbowKit
- **Styling**: CSS Modules
- **Testing**: Jest + React Testing Library + fast-check

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

4. Set up the database:

```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:property` - Run property-based tests
- `npm run test:integration` - Run integration tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── gallery/           # Gallery page
│   ├── rules/             # Rules page
│   ├── stake/             # Staking page
│   ├── survival/          # Survival game page
│   ├── graveyard/         # Graveyard page
│   ├── treasury/          # Treasury page
│   └── ranks/             # Leaderboard page
├── components/            # React components
│   ├── layout/           # Layout components (Navbar, Footer, etc.)
│   ├── wallet/           # Wallet connection components
│   ├── game/             # Game-specific components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility libraries and services
│   ├── prisma.ts         # Prisma client singleton
│   ├── blockchain/       # Blockchain interaction services
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── types/                 # TypeScript type definitions
├── prisma/               # Prisma schema and migrations
├── styles/               # Global styles and CSS modules
└── tests/                # Test files
    ├── unit/             # Unit tests
    ├── integration/      # Integration tests
    └── property/         # Property-based tests
```

## Soft-Staking Architecture

This application uses a **soft-staking** approach where NFT staking is managed entirely in the database without blockchain transactions:

- ⚡ **Instant staking/unstaking** - No waiting for blockchain confirmations
- 💰 **Zero gas fees** - Completely free for users
- 🎯 **Simplified UX** - No transaction signing required
- 📊 **Database as source of truth** - Better performance for queries and leaderboards

The blockchain service is used only for read-only operations (verifying NFT ownership). All staking state is managed in PostgreSQL.

For detailed information, see [SOFT_STAKING_GUIDE.md](./SOFT_STAKING_GUIDE.md)

## Environment Variables

See `.env.example` for required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CHAIN_ID` - Ethereum network chain ID (1 for mainnet)
- `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` - NFT contract address (read-only for ownership verification)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID for wallet integration
- `ADMIN_API_KEY` - Admin API key for protected endpoints (generate with `openssl rand -hex 32`)

## API Endpoints

### Staking (Soft-Staking)
- `POST /api/staking/stake` - Stake NFT (database update only)
- `POST /api/staking/stake-all` - Enter game (stake all wallet NFTs at once)

### NFT Management
- `POST /api/nft/update-owner` - Sync NFT ownership from blockchain
- `GET /api/nft/health` - Get NFT health status
- `GET /api/nft/dead` - Get dead NFTs for an address
- `POST /api/nft/kill` - Mark NFT as dead (admin/game mechanics)
- `POST /api/nft/update-health` - Update NFT health (admin/game mechanics)
- `POST /api/nft/audit` - Record audit for NFT (admin/game mechanics)

### Points & Stats
- `GET /api/points/total` - Get user's total points
- `GET /api/stats/global` - Get global game statistics
- `GET /api/collection/stats` - Get collection statistics

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard with pagination

### Health
- `GET /api/health` - Health check endpoint

### Admin (Protected)
- `GET /api/admin/dashboard` - Admin dashboard statistics
- `POST /api/admin/bulk-operations` - Bulk operations on NFTs
- `GET /api/admin/cache` - Cache statistics
- `DELETE /api/admin/cache` - Clear cache

For detailed API documentation, see:
- [Staking API](./app/api/staking/README.md)
- [NFT Management API](./app/api/nft/README.md)
- [Authentication Guide](./AUTHENTICATION_GUIDE.md)

## Documentation

- [Quick Start Guide](./QUICK_START.md) - Get started in 5 minutes
- [Soft-Staking Guide](./SOFT_STAKING_GUIDE.md) - Complete implementation guide
- [Soft-Staking Verification](./SOFT_STAKING_VERIFICATION.md) - Integration verification report
- [Unstake Verification Tests](./UNSTAKE_VERIFICATION_TEST.md) - Test cases for unstaked NFTs
- [Final Verification Report](./FINAL_VERIFICATION_REPORT.md) - Complete verification report
- [API Documentation](./app/api/staking/README.md) - API reference
- [Service Documentation](./lib/services/README.md) - Service layer documentation
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Project Summary](./PROJECT_SUMMARY.md) - Complete project overview

## License

Private - All rights reserved
