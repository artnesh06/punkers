# Requirements Document

## Introduction

Fitur "Recent Transactions" pada halaman utama (`/`) menampilkan feed transaksi game terbaru dari tabel `trn_point`. Feed ini menampilkan semua jenis transaksi game (claim, tax, slot, loot, bounty, execution, penalty) dengan ikon, warna, dan format waktu relatif sesuai referensi HTML. Hanya transaksi game yang ditampilkan — perubahan setup/konfigurasi tidak termasuk.

## Glossary

- **Transaction_API**: Endpoint API (`/api/transactions/recent`) yang mengambil transaksi terbaru dari database
- **Home_Page**: Halaman utama aplikasi (`/`) yang menampilkan feed Recent Transactions
- **Transaction_Feed**: Komponen UI yang menampilkan daftar transaksi terbaru dengan ikon, deskripsi, dan waktu relatif
- **trn_point**: Tabel database yang menyimpan semua transaksi poin game
- **Wallet_Address**: Alamat wallet Ethereum pengguna (format `0x...`), disimpan di field `address` pada `mst_users`
- **Transaction_Type**: Jenis transaksi game: `EARNING_CLAIM`, `TAX_PAYMENT`, `SLOT_BET`, `SLOT_WIN`, `LOOT_OPEN`, `LOOT_WIN`, `EXECUTION_BOUNTY`, `AUDIT_BOUNTY`, `penalty`, `AUDIT_PENALTY`, `EXECUTION_FORFEIT`
- **Relative_Time**: Format waktu yang menunjukkan selisih dari waktu sekarang (contoh: "2m ago", "1h ago")

## Requirements

### Requirement 1: API Endpoint untuk Transaksi Terbaru

**User Story:** Sebagai developer, saya ingin endpoint API yang mengembalikan transaksi game terbaru, sehingga halaman utama dapat menampilkan feed transaksi secara real-time.

#### Acceptance Criteria

1. WHEN a GET request is received at `/api/transactions/recent`, THE Transaction_API SHALL return the 20 most recent transactions from the trn_point table ordered by `createdAt` descending.
2. THE Transaction_API SHALL include only game Transaction_Type values: `EARNING_CLAIM`, `TAX_PAYMENT`, `SLOT_BET`, `SLOT_WIN`, `LOOT_OPEN`, `LOOT_WIN`, `EXECUTION_BOUNTY`, `AUDIT_BOUNTY`, `penalty`, `AUDIT_PENALTY`, and `EXECUTION_FORFEIT`.
3. THE Transaction_API SHALL return each transaction with the fields: `id`, `type`, `points`, `description`, `userAddress` (truncated Wallet_Address), `icon`, `color`, and `timeAgo` (Relative_Time).
4. THE Transaction_API SHALL truncate the Wallet_Address to the format `0xAAAA...BBBB` (first 6 characters and last 4 characters).
5. THE Transaction_API SHALL map each Transaction_Type to an icon: `EARNING_CLAIM` → 💎, `TAX_PAYMENT` → 💸, `SLOT_BET` → 🎰, `SLOT_WIN` → 🎰, `LOOT_OPEN` → 📦, `LOOT_WIN` → 📦, `EXECUTION_BOUNTY` → 💀, `AUDIT_BOUNTY` → 🎯, `penalty` → 💀, `AUDIT_PENALTY` → ⚠️, `EXECUTION_FORFEIT` → ⚔️.
6. THE Transaction_API SHALL map each Transaction_Type to a color: `EARNING_CLAIM` → `var(--accent-green)`, `TAX_PAYMENT` → `var(--accent-red)`, `SLOT_BET` → `var(--accent-red)`, `SLOT_WIN` → `var(--accent-yellow)`, `LOOT_OPEN` → `var(--text-secondary)`, `LOOT_WIN` → `var(--accent-purple)`, `EXECUTION_BOUNTY` → `var(--accent-green)`, `AUDIT_BOUNTY` → `var(--accent-green)`, `penalty` → `var(--accent-red)`, `AUDIT_PENALTY` → `var(--accent-red)`, `EXECUTION_FORFEIT` → `var(--accent-red)`.
7. IF the database query fails, THEN THE Transaction_API SHALL return HTTP status 500 with a JSON error message `{ "error": "Failed to fetch recent transactions" }`.

### Requirement 2: Format Waktu Relatif

**User Story:** Sebagai pemain, saya ingin melihat waktu transaksi dalam format relatif, sehingga saya dapat mengetahui seberapa baru transaksi tersebut.

#### Acceptance Criteria

1. THE Transaction_API SHALL format the `timeAgo` field as Relative_Time using the following rules: less than 60 seconds → `"Xs ago"`, 1–59 minutes → `"Xm ago"`, 1–23 hours → `"Xh ago"`, 1 or more days → `"Xd ago"`.
2. THE Transaction_API SHALL calculate Relative_Time based on the difference between the current server time and the transaction `createdAt` timestamp.

### Requirement 3: Integrasi Home Page

**User Story:** Sebagai pemain, saya ingin melihat transaksi game terbaru di halaman utama, sehingga saya dapat mengikuti aktivitas game secara langsung.

#### Acceptance Criteria

1. WHEN the Home_Page loads, THE Home_Page SHALL fetch transactions from the Transaction_API endpoint `/api/transactions/recent`.
2. THE Transaction_Feed SHALL display each transaction as a row containing: the icon (from API), the transaction description text, and the Relative_Time aligned to the right.
3. THE Transaction_Feed SHALL style each transaction row with the color returned by the Transaction_API for the transaction icon.
4. WHILE the Transaction_API request is in progress, THE Home_Page SHALL display the existing empty state (`📭 No transactions yet`).
5. IF the Transaction_API request fails, THEN THE Home_Page SHALL continue displaying the empty state without showing an error to the user.
6. THE Transaction_Feed SHALL use monospace font (`var(--font-mono)`) and font size 14px, matching the HTML reference styling.
7. THE Transaction_Feed SHALL display each row with a bottom border of `1px solid var(--border-color)`, matching the HTML reference layout.

### Requirement 4: Tampilan Deskripsi Transaksi

**User Story:** Sebagai pemain, saya ingin deskripsi transaksi yang jelas dan informatif, sehingga saya dapat memahami apa yang terjadi dalam game.

#### Acceptance Criteria

1. WHEN a transaction has a non-empty `description` field, THE Transaction_API SHALL use the `description` value as the display text.
2. WHEN a transaction has an empty or null `description` field, THE Transaction_API SHALL generate a fallback display text using the format `"{truncated_address} {type_label}"` where `type_label` is a human-readable label for the Transaction_Type (e.g., `EARNING_CLAIM` → "claimed earnings", `TAX_PAYMENT` → "paid tax", `SLOT_BET` → "bet on Slot Machine", `SLOT_WIN` → "won on Slot Machine", `LOOT_OPEN` → "opened Loot Chest", `LOOT_WIN` → "won Loot prize", `EXECUTION_BOUNTY` → "earned execution bounty", `AUDIT_BOUNTY` → "earned audit bounty", `penalty` → "received death penalty", `AUDIT_PENALTY` → "received audit penalty", `EXECUTION_FORFEIT` → "forfeited earnings").
