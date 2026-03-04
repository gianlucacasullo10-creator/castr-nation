-- When a club is deleted, automatically remove its members (no orphaned rows)
ALTER TABLE club_members DROP CONSTRAINT IF EXISTS club_members_club_id_fkey;
ALTER TABLE club_members ADD CONSTRAINT club_members_club_id_fkey
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE;

-- Clean up any existing orphaned memberships
DELETE FROM club_members
WHERE club_id NOT IN (SELECT id FROM clubs);
