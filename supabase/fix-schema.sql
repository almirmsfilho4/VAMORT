-- Fix missing columns from previous partial runs
-- Run this in Supabase SQL Editor

-- 1. Add missing user_id to match_actions (causing the policy error)
ALTER TABLE match_actions 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ensure match_players has user_id
ALTER TABLE match_players 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Ensure matches has winner_id
ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES auth.users(id);

-- 4. Ensure matchmaking_queue has all columns
ALTER TABLE matchmaking_queue 
  ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ;

-- 5. Recreate policies now that columns exist
DROP POLICY IF EXISTS "matchaction_self_insert" ON match_actions;
CREATE POLICY "matchaction_self_insert" ON match_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "matchaction_read" ON match_actions;
CREATE POLICY "matchaction_read" ON match_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM match_players WHERE match_id = match_actions.match_id AND user_id = auth.uid())
);

-- 6. Verify all columns exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('match_actions', 'match_players', 'matches', 'matchmaking_queue')
ORDER BY table_name, ordinal_position;