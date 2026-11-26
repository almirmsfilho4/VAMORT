-- Tournament matches table (no FK to tournaments since it may not exist)
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  round INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  player1_id UUID,
  player2_id UUID,
  score1 INTEGER DEFAULT 0,
  score2 INTEGER DEFAULT 0,
  winner_id UUID,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clan wars table
CREATE TABLE IF NOT EXISTS clan_wars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id UUID,
  opponent_clan_id UUID,
  status TEXT DEFAULT 'pending',
  clan_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  winner_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clan war battles table
CREATE TABLE IF NOT EXISTS clan_war_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  war_id UUID REFERENCES clan_wars(id) ON DELETE CASCADE,
  player1_id UUID,
  player2_id UUID,
  winner_id UUID,
  clan_id UUID,
  score INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_wars ENABLE ROW LEVEL SECURITY;
ALTER TABLE clan_war_battles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_matches
CREATE POLICY "Anyone can view tournament matches" ON tournament_matches
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage matches" ON tournament_matches
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for clan_wars
CREATE POLICY "Anyone can view clan wars" ON clan_wars
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage wars" ON clan_wars
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for clan_war_battles
CREATE POLICY "Anyone can view clan war battles" ON clan_war_battles
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can record battles" ON clan_war_battles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE clan_wars;
ALTER PUBLICATION supabase_realtime ADD TABLE clan_war_battles;