# Implementation Plan: Home Recent Transactions

## Overview

Implement a real-time transaction feed on the home page showing the 20 most recent game transactions. Build utility functions first, then the API route, then integrate into the home page. All data enrichment (icon, color, address truncation, time formatting) happens server-side so the client receives ready-to-render data.

## Tasks

- [x] 1. Create utility functions in `lib/utils/transactions.ts`
  - [x] 1.1 Implement `truncateAddress(address: string): string`
    - Truncate Ethereum address to `0xAAAA...BBBB` format (first 6 + last 4 characters)
    - Handle edge cases: null/missing address returns `"0x0000...0000"`, short addresses returned as-is
    - _Requirements: 1.4_

  - [x] 1.2 Implement `formatTimeAgo(date: Date): string`
    - Calculate difference between current server time and the given date
    - Return `"Xs ago"` for <60s, `"Xm ago"` for 1-59min, `"Xh ago"` for 1-23h, `"Xd ago"` for ≥1 day
    - _Requirements: 2.1, 2.2_

  - [x] 1.3 Implement `getTransactionIcon(type: string): string`
    - Map each of the 11 game transaction types to its emoji icon per the mapping table in the design
    - Return default icon `📋` for unknown types
    - _Requirements: 1.5_

  - [x] 1.4 Implement `getTransactionColor(type: string): string`
    - Map each of the 11 game transaction types to its CSS variable per the mapping table in the design
    - Return default color `var(--text-secondary)` for unknown types
    - _Requirements: 1.6_

  - [x] 1.5 Implement `getTransactionLabel(type: string): string` and `buildDescription(tx, truncatedAddress): string`
    - `getTransactionLabel` maps type to human-readable label (e.g., `EARNING_CLAIM` → "claimed earnings")
    - `buildDescription` returns `tx.description` if non-empty, otherwise generates `"{truncatedAddress} {typeLabel}"` fallback
    - _Requirements: 4.1, 4.2_

  - [ ]* 1.6 Write property tests for utility functions using `fast-check`
    - **Property 3: Address truncation format** — random valid Ethereum addresses produce correct `0xHHHH...HHHH` pattern
    - **Validates: Requirements 1.4**

  - [ ]* 1.7 Write property test for `formatTimeAgo`
    - **Property 4: Relative time formatting buckets** — random non-negative seconds produce correct bucket format
    - **Validates: Requirements 2.1**

  - [ ]* 1.8 Write property test for `buildDescription`
    - **Property 5: Description builder logic** — transactions with descriptions return them unchanged; without descriptions return fallback format
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 1.9 Write property test for type mapping completeness
    - **Property 6: Type-to-icon and type-to-color mapping completeness** — all valid game types produce non-empty icon and color strings
    - **Validates: Requirements 1.5, 1.6**

- [x] 2. Checkpoint - Verify utility functions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create API route `app/api/transactions/recent/route.ts`
  - [x] 3.1 Implement GET handler
    - Query `trn_point` with `take: 20`, `orderBy: { createdAt: 'desc' }`, filter by game types only (`EARNING_CLAIM`, `TAX_PAYMENT`, `SLOT_BET`, `SLOT_WIN`, `LOOT_OPEN`, `LOOT_WIN`, `EXECUTION_BOUNTY`, `AUDIT_BOUNTY`, `penalty`, `AUDIT_PENALTY`, `EXECUTION_FORFEIT`)
    - Include `user: { select: { address: true } }` for wallet address join
    - Map each row using utility functions: `truncateAddress`, `formatTimeAgo`, `getTransactionIcon`, `getTransactionColor`, `buildDescription`
    - Return `{ success: true, transactions: RecentTransaction[] }`
    - On error: return HTTP 500 with `{ error: "Failed to fetch recent transactions" }`, log via `console.error`
    - _Requirements: 1.1, 1.2, 1.3, 1.7_

  - [ ]* 3.2 Write unit tests for the API route
    - Mock Prisma, verify response shape matches `TransactionResponse` interface
    - Verify HTTP 500 response on database error
    - _Requirements: 1.1, 1.3, 1.7_

- [x] 4. Integrate transaction feed into `app/page.tsx`
  - [x] 4.1 Add data fetching with `useEffect`
    - Add `useEffect` to fetch `/api/transactions/recent` on component mount
    - Replace static `const [recentTx] = useState<any[]>([])` with `useState` + setter populated from API response
    - On fetch error: silently catch, keep `recentTx` as empty array (existing empty state displays)
    - While loading: display existing empty state (`📭 No transactions yet`)
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 4.2 Update transaction row rendering
    - Render each transaction row with: icon (18px, colored with `tx.color`), description text (flex:1), timeAgo (right-aligned)
    - Use monospace font `var(--font-mono)` at 14px
    - Add `border-bottom: 1px solid var(--border-color)` to each row
    - Remove old inline ternary icon logic, use `tx.icon` and `tx.color` from API response directly
    - _Requirements: 3.2, 3.3, 3.6, 3.7_

  - [ ]* 4.3 Write unit tests for home page transaction rendering
    - **Property 7: Transaction row rendering completeness** — rendered rows contain icon, description, and timeAgo
    - **Validates: Requirements 3.2, 3.3**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using `fast-check`
- All data enrichment happens server-side in the API route — the client renders pre-mapped data
