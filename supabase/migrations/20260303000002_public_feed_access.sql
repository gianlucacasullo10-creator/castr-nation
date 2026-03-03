-- Allow unauthenticated users to read the public catch feed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'catches'
      AND policyname = 'Catches are publicly viewable'
  ) THEN
    CREATE POLICY "Catches are publicly viewable"
      ON catches FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Allow unauthenticated users to read public profiles (needed for feed display names / avatars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Profiles are publicly viewable'
  ) THEN
    CREATE POLICY "Profiles are publicly viewable"
      ON profiles FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Allow unauthenticated users to read likes (for like counts on the feed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'likes'
      AND policyname = 'Likes are publicly viewable'
  ) THEN
    CREATE POLICY "Likes are publicly viewable"
      ON likes FOR SELECT
      USING (true);
  END IF;
END
$$;

-- Allow unauthenticated users to read comments (for comment counts / comment text on feed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'comments'
      AND policyname = 'Comments are publicly viewable'
  ) THEN
    CREATE POLICY "Comments are publicly viewable"
      ON comments FOR SELECT
      USING (true);
  END IF;
END
$$;
