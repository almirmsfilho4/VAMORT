-- Complete VAMORT Multiplayer Schema - Run once in Supabase SQL Editor
-- Creates all tables, indexes, RLS policies, and realtime publication in correct order

-- ============================================
-- 1. CREATE TABLES (no dependencies first)
-- ============================================

-- Matchmaking Queue
CREATE TABLE IF NOT EXISTS matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_class TEXT NOT NULL CHECK (player_class IN ('VAMPIRE', 'HUMAN')),
  deck_ids TEXT[] NOT NULL,
  rating INTEGER DEFAULT 1000,
  status TEXT DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled')),
  region TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished', 'abandoned')),
  mode TEXT DEFAULT 'ranked' CHECK (mode IN ('ranked', 'casual', 'friendly')),
  current_turn UUID REFERENCES auth.users(id),
  turn_number INTEGER DEFAULT 0,
  turn_started_at TIMESTAMPTZ,
  turn_time_limit INTEGER DEFAULT 90,
  seed INTEGER NOT NULL,
  winner_id UUID REFERENCES auth.users(id),
  result_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- Match Players (depends on matches)
CREATE TABLE IF NOT EXISTS match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_class TEXT NOT NULL CHECK (player_class IN ('VAMPIRE', 'HUMAN')),
  deck_ids TEXT[] NOT NULL,
  health INTEGER DEFAULT 30,
  mana INTEGER DEFAULT 0,
  max_mana INTEGER DEFAULT 0,
  hand TEXT[] DEFAULT '{}',
  deck TEXT[] DEFAULT '{}',
  graveyard TEXT[] DEFAULT '{}',
  board JSONB DEFAULT '[]',
  secrets JSONB DEFAULT '[]',
  disconnected BOOLEAN DEFAULT FALSE,
  disconnected_at TIMESTAMPTZ,
  surrender BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match Actions (depends on matches)
CREATE TABLE IF NOT EXISTS match_actions (
  id BIGSERIAL PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  server_validated BOOLEAN DEFAULT FALSE,
  validation_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_status ON matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_queue_rating ON matchmaking_queue(rating);

CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players(user_id);

CREATE INDEX IF NOT EXISTS idx_match_actions_match ON match_actions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_actions_turn ON match_actions(match_id, turn_number);

-- ============================================
-- 3. REALTIME PUBLICATION (after tables exist)
-- ============================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE matches;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE match_players;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE match_actions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_actions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. POLICIES (idempotent with DO blocks)
-- ============================================

-- matchmaking_queue policies
DO $$ BEGIN
  CREATE POLICY "queue_self_insert" ON matchmaking_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "queue_self_update" ON matchmaking_queue FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "queue_read_searching" ON matchmaking_queue FOR SELECT USING (status = 'searching' OR auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- matches policies
DO $$ BEGIN
  CREATE POLICY "match_participant_read" ON matches FOR SELECT USING (
    EXISTS (SELECT 1 FROM match_players WHERE match_id = matches.id AND user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "match_participant_update" ON matches FOR UPDATE USING (
    EXISTS (SELECT 1 FROM match_players WHERE match_id = matches.id AND user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- match_players policies
DO $$ BEGIN
  CREATE POLICY "matchplayer_read" ON match_players FOR SELECT USING (
    EXISTS (SELECT 1 FROM match_players mp2 WHERE mp2.match_id = match_players.match_id AND mp2.user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "matchplayer_self_update" ON match_players FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- match_actions policies
DO $$ BEGIN
  CREATE POLICY "matchaction_read" ON match_actions FOR SELECT USING (
    EXISTS (SELECT 1 FROM match_players WHERE match_id = match_actions.match_id AND user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "matchaction_self_insert" ON match_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION find_active_match(user_uuid UUID)
RETURNS UUID AS $$
  SELECT m.id FROM matches m
  JOIN match_players mp ON mp.match_id = m.id
  WHERE mp.user_id = user_uuid
  AND m.status IN ('waiting', 'active')
  ORDER BY m.created_at DESC LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_abandoned_matches()
RETURNS VOID AS $$
  UPDATE matches SET status = 'abandoned', finished_at = NOW()
  WHERE status IN ('waiting', 'active')
  AND (
    (status = 'waiting' AND created_at < NOW() - INTERVAL '2 minutes')
    OR
    (status = 'active' AND turn_started_at < NOW() - INTERVAL '2 minutes')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- 7. VERIFICATION QUERY
-- ============================================

SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('match_actions', 'match_players', 'matches', 'matchmaking_queue')
ORDER BY table_name, ordinal_position;