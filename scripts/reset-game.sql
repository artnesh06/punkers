-- ============================================
-- PUNKERS Game Reset Script — Back to Day 0
-- ============================================
-- Resets all game-related data per PUNKERS rules.
-- Keeps: user accounts, project/collection setup, 
--        game config, ads pricing, certificates, ads, flowers.
--
-- Run with: psql -d your_database -f scripts/reset-game.sql
-- Or via admin API: POST /api/admin/reset-game
-- ============================================

BEGIN;

-- 1. Child tables with FK to mst_game
DELETE FROM mst_winner;

-- 2. Child tables with FK to mst_users
DELETE FROM trn_point;
DELETE FROM trn_participant;
DELETE FROM trn_loot_open;

-- 3. Child tables with FK to mst_collection + mst_users
DELETE FROM mst_staker;

-- 4. Tables without FK constraints
DELETE FROM trn_slot_spin;
DELETE FROM audit_log;

-- 5. Game sessions (delete, not update — start completely fresh)
DELETE FROM mst_game;

-- 6. Game state (auto-created on first API call)
DELETE FROM game_state;

-- 7. Reset user $PUNK balance to 0 (keep accounts)
UPDATE mst_users SET points = 0;

COMMIT;
