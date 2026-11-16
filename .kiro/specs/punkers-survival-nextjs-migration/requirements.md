# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk migrasi game Punkers Survival dari HTML standalone menjadi aplikasi Next.js modern dengan integrasi blockchain Ethereum. Project ini akan mengkonversi game HTML existing, mengintegrasikan backend Prisma dengan PostgreSQL, dan menambahkan fitur wallet connect untuk verifikasi NFT ownership. Sistem menggunakan soft-staking approach dimana staking dikelola sepenuhnya di database tanpa memerlukan transaksi blockchain.

## Glossary

- **Next_App**: Aplikasi Next.js yang akan dibangun untuk menggantikan HTML game
- **Prisma_Client**: ORM client untuk berinteraksi dengan PostgreSQL database
- **Wallet_Connector**: Komponen yang menghandle koneksi wallet Ethereum (Wagmi/RainbowKit)
- **Game_Engine**: Komponen yang menghandle logika game Punkers Survival
- **API_Routes**: Next.js API routes untuk backend operations
- **Database_Schema**: Struktur database Prisma yang sudah didefinisikan
- **NFT_Owner**: User yang memiliki NFT Punkers
- **Staking_System**: Sistem soft-staking untuk manage NFT staking status di database tanpa blockchain transactions
- **Leaderboard_System**: Sistem ranking berdasarkan points
- **Ethereum_L1**: Ethereum Layer 1 blockchain network (digunakan untuk read-only NFT ownership verification)

## Requirements

### Requirement 1: Next.js Project Setup

**User Story:** Sebagai developer, saya ingin setup project Next.js dengan versi terbaru, sehingga aplikasi menggunakan teknologi modern dan best practices.

#### Acceptance Criteria

1. THE Next_App SHALL menggunakan Next.js versi 14 atau lebih baru
2. THE Next_App SHALL menggunakan TypeScript untuk type safety
3. THE Next_App SHALL menggunakan App Router (bukan Pages Router)
4. THE Next_App SHALL memiliki konfigurasi ESLint dan Prettier
5. THE Next_App SHALL memiliki struktur folder yang terorganisir (app, components, lib, types)

### Requirement 2: Prisma Database Integration

**User Story:** Sebagai developer, saya ingin mengintegrasikan Prisma ORM dengan PostgreSQL, sehingga aplikasi dapat berinteraksi dengan database yang sudah ada.

#### Acceptance Criteria

1. THE Prisma_Client SHALL terhubung ke PostgreSQL menggunakan DATABASE_URL dari environment variable
2. THE Database_Schema SHALL mendefinisikan model mst_users dengan field address, discord, twitter, dan points
3. THE Database_Schema SHALL mendefinisikan model mst_project dengan field leaderboard, banner, dan social media
4. THE Database_Schema SHALL mendefinisikan model mst_reward dengan relasi ke collection dan token
5. THE Database_Schema SHALL mendefinisikan model mst_collection untuk NFT collection data
6. THE Database_Schema SHALL mendefinisikan model mst_staker dengan relasi ke user dan collection
7. THE Database_Schema SHALL mendefinisikan model trn_point untuk transaction history
8. THE Database_Schema SHALL mendefinisikan model mst_attributes_reward untuk attribute-based rewards
9. THE Database_Schema SHALL mendefinisikan model trn_participant untuk participant transactions
10. WHEN Prisma_Client diinisialisasi, THE Next_App SHALL menggunakan singleton pattern untuk connection pooling

### Requirement 3: Wallet Connection Integration

**User Story:** Sebagai user, saya ingin connect wallet Ethereum saya, sehingga saya dapat berinteraksi dengan aplikasi menggunakan address saya.

#### Acceptance Criteria

1. THE Wallet_Connector SHALL support Wagmi atau RainbowKit library
2. WHEN user click connect button, THE Wallet_Connector SHALL menampilkan modal untuk memilih wallet provider
3. THE Wallet_Connector SHALL support MetaMask, WalletConnect, dan Coinbase Wallet
4. WHEN wallet connected, THE Next_App SHALL menampilkan address user yang sudah disingkat
5. THE Wallet_Connector SHALL terhubung ke Ethereum Layer 1 network
6. WHEN user belum connect wallet, THE Next_App SHALL menampilkan tombol "Connect Wallet"
7. WHEN wallet connected, THE Next_App SHALL menyimpan address di state management
8. THE Wallet_Connector SHALL handle disconnect wallet functionality

### Requirement 4: Game UI Conversion

**User Story:** Sebagai user, saya ingin melihat game Punkers Survival dengan UI yang sama seperti HTML version, sehingga experience tetap konsisten.

#### Acceptance Criteria

1. THE Game_Engine SHALL mengkonversi semua HTML markup menjadi React components
2. THE Game_Engine SHALL mengkonversi semua CSS styles menjadi CSS modules atau Tailwind classes
3. THE Game_Engine SHALL preserve semua visual elements (ticker, navbar, panels, cards)
4. THE Game_Engine SHALL preserve semua animations dan transitions
5. THE Game_Engine SHALL responsive untuk mobile dan desktop
6. THE Game_Engine SHALL mengkonversi semua inline JavaScript menjadi React hooks dan event handlers
7. THE Game_Engine SHALL maintain semua game pages (Gallery, Rules, Stake, Survival, Graveyard, Treasury, Ranks)

### Requirement 5: API Routes untuk Backend Operations

**User Story:** Sebagai developer, saya ingin membuat API routes untuk backend operations, sehingga frontend dapat berinteraksi dengan database.

#### Acceptance Criteria

1. THE API_Routes SHALL menyediakan endpoint POST /api/nft/update-owner untuk update NFT ownership
2. WHEN POST /api/nft/update-owner dipanggil dengan address, THE API_Routes SHALL update mst_staker table
3. THE API_Routes SHALL menyediakan endpoint POST /api/staking/stake untuk stake NFT
4. WHEN POST /api/staking/stake dipanggil dengan address dan tokenId, THE API_Routes SHALL update mst_staker dengan isStaked=true dan stakedAt=current timestamp
5. THE API_Routes SHALL menyediakan endpoint POST /api/staking/unstake untuk unstake NFT
6. WHEN POST /api/staking/unstake dipanggil dengan address dan tokenId, THE API_Routes SHALL update mst_staker dengan isStaked=false dan unstakedAt=current timestamp
7. THE API_Routes SHALL menyediakan endpoint GET /api/points/total untuk mendapatkan total points user
8. WHEN GET /api/points/total dipanggil dengan address, THE API_Routes SHALL menghitung total points berdasarkan NFT dan attributes
9. THE API_Routes SHALL menyediakan endpoint GET /api/leaderboard untuk mendapatkan ranking
10. WHEN GET /api/leaderboard dipanggil, THE API_Routes SHALL return data dengan pagination support
11. THE API_Routes SHALL menyediakan endpoint GET /api/leaderboard dengan query params page dan limit
12. THE API_Routes SHALL validate semua input parameters
13. IF validation fails, THEN THE API_Routes SHALL return error response dengan status code 400
14. IF database error occurs, THEN THE API_Routes SHALL return error response dengan status code 500

### Requirement 6: NFT Ownership Update System

**User Story:** Sebagai system, saya ingin update NFT ownership secara otomatis, sehingga data ownership selalu akurat.

#### Acceptance Criteria

1. THE Next_App SHALL menyediakan function updateNftOwner yang menerima address parameter
2. WHEN updateNftOwner dipanggil, THE Next_App SHALL query blockchain untuk mendapatkan NFT yang dimiliki address
3. WHEN NFT ownership data diterima, THE Next_App SHALL update mst_staker table di database
4. THE Next_App SHALL handle multiple NFT collections
5. IF blockchain query fails, THEN THE Next_App SHALL retry maksimal 3 kali
6. IF all retries fail, THEN THE Next_App SHALL log error dan return failure status

### Requirement 7: Points Calculation System

**User Story:** Sebagai user, saya ingin melihat total points saya, sehingga saya tahu ranking saya di leaderboard.

#### Acceptance Criteria

1. THE Next_App SHALL menyediakan function getTotalPoints yang menerima address parameter
2. WHEN getTotalPoints dipanggil, THE Next_App SHALL query mst_staker untuk mendapatkan NFT yang dimiliki user
3. WHEN NFT data diterima, THE Next_App SHALL query mst_attributes_reward untuk mendapatkan points berdasarkan attributes
4. THE Next_App SHALL menjumlahkan semua points dari NFT dan attributes
5. THE Next_App SHALL query trn_point untuk mendapatkan transaction history
6. THE Next_App SHALL return total points sebagai number
7. FOR ALL valid addresses, THE Next_App SHALL return points >= 0

### Requirement 8: Leaderboard Display System

**User Story:** Sebagai user, saya ingin melihat leaderboard dengan ranking semua players, sehingga saya dapat membandingkan performa saya.

#### Acceptance Criteria

1. THE Leaderboard_System SHALL menampilkan ranking berdasarkan total points
2. THE Leaderboard_System SHALL menampilkan address, points, dan rank untuk setiap user
3. THE Leaderboard_System SHALL support pagination dengan default 50 entries per page
4. WHEN user scroll ke bottom, THE Leaderboard_System SHALL load next page automatically
5. THE Leaderboard_System SHALL highlight current user di leaderboard
6. THE Leaderboard_System SHALL update data setiap 30 detik
7. THE Leaderboard_System SHALL menampilkan loading state saat fetch data
8. IF leaderboard data kosong, THEN THE Leaderboard_System SHALL menampilkan empty state message

### Requirement 9: Staking Interface

**User Story:** Sebagai NFT owner, saya ingin stake NFT saya, sehingga saya dapat earn points.

#### Acceptance Criteria

1. THE Staking_System SHALL menampilkan semua NFT yang dimiliki user
2. THE Staking_System SHALL menampilkan status staking untuk setiap NFT (staked/unstaked)
3. WHEN user click stake button, THE Staking_System SHALL update mst_staker table dengan isStaked=true dan stakedAt=current timestamp
4. WHEN user click unstake button, THE Staking_System SHALL update mst_staker table dengan isStaked=false dan unstakedAt=current timestamp
5. THE Staking_System SHALL menampilkan estimated points per day untuk setiap NFT
6. THE Staking_System SHALL disable stake button jika wallet tidak connected
7. THE Staking_System SHALL update UI immediately setelah database update berhasil
8. IF database update fails, THEN THE Staking_System SHALL menampilkan error message dan revert UI state

### Requirement 10: Environment Configuration

**User Story:** Sebagai developer, saya ingin konfigurasi environment yang proper, sehingga aplikasi dapat berjalan di development dan production.

#### Acceptance Criteria

1. THE Next_App SHALL membaca DATABASE_URL dari .env file
2. THE Next_App SHALL membaca NEXT_PUBLIC_CHAIN_ID dari .env file untuk network configuration
3. THE Next_App SHALL membaca NEXT_PUBLIC_NFT_CONTRACT_ADDRESS dari .env file untuk NFT contract address (read-only operations)
4. THE Next_App SHALL validate semua required environment variables saat startup
5. IF required environment variable missing, THEN THE Next_App SHALL throw error dengan descriptive message
6. THE Next_App SHALL menyediakan .env.example file sebagai template
7. THE Next_App SHALL tidak commit .env file ke git repository

### Requirement 11: Error Handling dan Logging

**User Story:** Sebagai developer, saya ingin proper error handling dan logging, sehingga saya dapat debug issues dengan mudah.

#### Acceptance Criteria

1. THE Next_App SHALL log semua API requests dengan timestamp dan endpoint
2. WHEN error occurs, THE Next_App SHALL log error message, stack trace, dan context
3. THE Next_App SHALL menampilkan user-friendly error messages di UI
4. THE Next_App SHALL tidak expose sensitive information di error messages
5. THE Next_App SHALL handle network errors dengan retry mechanism
6. THE Next_App SHALL handle database connection errors gracefully
7. IF critical error occurs, THEN THE Next_App SHALL menampilkan fallback UI

### Requirement 12: Performance Optimization

**User Story:** Sebagai user, saya ingin aplikasi yang fast dan responsive, sehingga experience saya smooth.

#### Acceptance Criteria

1. THE Next_App SHALL menggunakan Next.js Image component untuk optimize images
2. THE Next_App SHALL implement code splitting untuk reduce initial bundle size
3. THE Next_App SHALL menggunakan React.memo untuk prevent unnecessary re-renders
4. THE Next_App SHALL implement caching untuk API responses
5. THE Next_App SHALL lazy load components yang tidak immediately visible
6. THE Next_App SHALL achieve Lighthouse performance score >= 80
7. THE Next_App SHALL load initial page dalam waktu < 3 detik pada 3G connection

### Requirement 13: Testing Setup

**User Story:** Sebagai developer, saya ingin testing infrastructure, sehingga saya dapat ensure code quality.

#### Acceptance Criteria

1. THE Next_App SHALL menggunakan Jest untuk unit testing
2. THE Next_App SHALL menggunakan React Testing Library untuk component testing
3. THE Next_App SHALL memiliki test coverage >= 70% untuk critical paths
4. THE Next_App SHALL include tests untuk API routes
5. THE Next_App SHALL include tests untuk utility functions
6. THE Next_App SHALL include tests untuk React components
7. THE Next_App SHALL run tests di CI/CD pipeline

### Requirement 14: Deployment Configuration

**User Story:** Sebagai developer, saya ingin deployment configuration yang proper, sehingga aplikasi dapat di-deploy dengan mudah.

#### Acceptance Criteria

1. THE Next_App SHALL menyediakan Dockerfile untuk containerization
2. THE Next_App SHALL menyediakan docker-compose.yml untuk local development
3. THE Next_App SHALL menyediakan build script untuk production build
4. THE Next_App SHALL optimize production bundle dengan tree shaking
5. THE Next_App SHALL generate static assets untuk pages yang bisa di-static
6. THE Next_App SHALL support deployment ke Vercel atau platform lain
7. THE Next_App SHALL include health check endpoint di /api/health
