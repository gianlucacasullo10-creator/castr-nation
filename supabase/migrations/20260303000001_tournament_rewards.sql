-- Track whether rewards have been distributed for a tournament
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS rewards_distributed boolean NOT NULL DEFAULT false;

-- Track individual reward records per user per tournament
CREATE TABLE IF NOT EXISTS tournament_rewards (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id uuid      REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid        REFERENCES profiles(id)   ON DELETE CASCADE NOT NULL,
  rank_position integer   NOT NULL,
  reward_description text NOT NULL,
  points_granted integer  NOT NULL DEFAULT 0,
  claimed_at  timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE tournament_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rewards"
  ON tournament_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
  ON tournament_rewards FOR UPDATE
  USING (auth.uid() = user_id);
