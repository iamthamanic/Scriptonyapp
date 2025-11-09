-- ================================================================
-- Migration 028: Add user_id to shots table
-- ================================================================
-- DEPLOYED: 2025-11-07 07:35 UTC
-- STATUS: ✅ SUCCESS

-- Problem: shots table was missing user_id column (forgotten in migration 025)
-- Impact: Shot creation failed with "column user_id does not exist"
-- Solution: Add user_id column with FK to auth.users

-- Add user_id column to shots table
ALTER TABLE shots 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Verification
SELECT 'Migration 028 complete: user_id added to shots table' as status;
