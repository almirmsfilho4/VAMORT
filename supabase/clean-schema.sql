-- CLEAN SLATE: Drop and recreate everything in correct order
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. DROP EVERYTHING (clean start)
-- ============================================

DROP TABLE IF EXISTS clan_log CASCADE;
DROP TABLE IF EXISTS clan_members CASCADE;
DROP TABLE IF EXISTS clans CASCADE;
DROP TABLE IF EXISTS match_actions CASCADE;
DROP TABLE IF EXISTS match_players CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS matchmaking_queue CASCADE;

DROP FUNCTION IF EXISTS find_active_match(UUID);
DROP FUNCTION IF EXISTS cleanup_abandoned_matches();

-- ============================================
-- 2. CREATE TABLES (correct order with all columns)
-- ============================================

-- Clans
CREATE TABLE clans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL UNIQUE,
  description TEXT,
  leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trophies INTEGER DEFAULT 0,
  min_rank TEXT DEFAULT 'bronze' CHECK (min_rank IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'grandmaster')),
  min_trophies INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clan Members
CREATE TABLE clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clan_id, user_id)
);

-- Clan Log (activity feed)
CREATE TABLE clan_log (
  id BIGSERIAL PRIMARY KEY,
  clan_id UUID REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drafts
CREATE TABLE drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seed BIGINT NOT NULL,
  picks TEXT[] DEFAULT '{}',
  deck_ids TEXT[] DEFAULT '{}',
  current_pack INTEGER DEFAULT 0,
  pack_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'drafting' CHECK (status IN ('drafting', 'completed', 'deck_saved', 'abandoned')),
  packs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Matchmaking Queue
CREATE TABLE matchmaking_queue (
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
CREATE TABLE matches (
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
CREATE TABLE match_players (
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

-- Match Actions (depends on matches) - WITH user_id
CREATE TABLE match_actions (
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
-- 3. INDEXES
-- ============================================

CREATE INDEX idx_clans_tag ON clans(tag);
CREATE INDEX idx_clans_trophies ON clans(trophies DESC);
CREATE INDEX idx_clans_leader ON clans(leader_id);
CREATE INDEX idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX idx_clan_members_user ON clan_members(user_id);
CREATE INDEX idx_clan_log_clan ON clan_log(clan_id, created_at DESC);

CREATE INDEX idx_drafts_user ON drafts(user_id, created_at DESC);
CREATE INDEX idx_drafts_status ON drafts(status);

CREATE INDEX idx_matchmaking_queue_status ON matchmaking_queue(status);
CREATE INDEX idx_matchmaking_queue_rating ON matchmaking_queue(rating);

CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_user ON match_players(user_id);

CREATE INDEX idx_match_actions_match ON match_actions(match_id);
CREATE INDEX idx_match_actions_turn ON match_actions(match_id, turn_number);

-- ============================================
-- 4. REALTIME PUBLICATION
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE clans;
ALTER PUBLICATION supabase_realtime ADD TABLE clan_members;
ALTER PUBLICATION supabase_realtime ADD TABLE clan_log;
ALTER PUBLICATION supabase_realtime ADD TABLE drafts;
ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_players;
ALTER PUBLICATION supabase_realtime ADD TABLE match_actions;

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_actions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. POLICIES
-- ============================================

-- clans
CREATE POLICY "clan_read_public" ON clans FOR SELECT USING (is_public = TRUE);
CREATE POLICY "clan_member_read" ON clans FOR SELECT USING (
  EXISTS (SELECT 1 FROM clan_members WHERE clan_id = clans.id AND user_id = auth.uid())
);
CREATE POLICY "clan_leader_update" ON clans FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "clan_self_create" ON clans FOR INSERT WITH CHECK (auth.uid() = leader_id);

-- clan_members
CREATE POLICY "clanmember_read" ON clan_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM clan_members cm2 WHERE cm2.clan_id = clan_members.clan_id AND cm2.user_id = auth.uid())
  OR clans.is_public = TRUE
);
CREATE POLICY "clanmember_self_join" ON clan_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clanmember_self_leave" ON clan_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "clanleader_manage" ON clan_members FOR ALL USING (
  EXISTS (SELECT 1 FROM clans WHERE id = clan_members.clan_id AND leader_id = auth.uid())
);
CREATE POLICY "clanofficer_manage" ON clan_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM clan_members cm 
    WHERE cm.clan_id = clan_members.clan_id 
    AND cm.user_id = auth.uid() 
    AND cm.role IN ('leader', 'officer')
  )
);

-- clan_log
CREATE POLICY "clanlog_read" ON clan_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM clan_members WHERE clan_id = clan_log.clan_id AND user_id = auth.uid())
);
CREATE POLICY "clanlog_self_insert" ON clan_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clan_members WHERE clan_id = clan_log.clan_id AND user_id = auth.uid())
);

-- drafts
CREATE POLICY "draft_self_read" ON drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "draft_self_insert" ON drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "draft_self_update" ON drafts FOR UPDATE USING (auth.uid() = user_id);

-- matchmaking_queue
CREATE POLICY "queue_self_insert" ON matchmaking_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "queue_self_update" ON matchmaking_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "queue_read_searching" ON matchmaking_queue FOR SELECT USING (status = 'searching' OR auth.uid() = user_id);

-- matches
CREATE POLICY "match_participant_read" ON matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM match_players WHERE match_id = matches.id AND user_id = auth.uid())
);
CREATE POLICY "match_participant_update" ON matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM match_players WHERE match_id = matches.id AND user_id = auth.uid())
);

-- match_players
CREATE POLICY "matchplayer_read" ON match_players FOR SELECT USING (
  EXISTS (SELECT 1 FROM match_players mp2 WHERE mp2.match_id = match_players.match_id AND mp2.user_id = auth.uid())
);
CREATE POLICY "matchplayer_self_update" ON match_players FOR UPDATE USING (auth.uid() = user_id);

-- match_actions
CREATE POLICY "matchaction_read" ON match_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM match_players WHERE match_id = match_actions.match_id AND user_id = auth.uid())
);
CREATE POLICY "matchaction_self_insert" ON match_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. HELPER FUNCTIONS
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
-- 8. VERIFICATION
-- ============================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('clans', 'clan_members', 'clan_log', 'match_actions', 'match_players', 'matches', 'matchmaking_queue')
ORDER BY table_name, ordinal_position;