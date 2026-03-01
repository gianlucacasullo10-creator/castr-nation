ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_pro                 boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_expires_at         timestamptz,
  ADD COLUMN IF NOT EXISTS last_legendary_drop_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_points_credit_at  timestamptz;
