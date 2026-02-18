-- Add game points to the fish_species table so point values live in the DB
-- and can be adjusted without a code deploy.

ALTER TABLE fish_species
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 25;

-- Seed all species used in the app with their point values.
-- Only updates rows with a matching name; inserts nothing new.
UPDATE fish_species SET points = 150 WHERE name ILIKE '%muskie%' OR name ILIKE '%muskellunge%';
UPDATE fish_species SET points = 90  WHERE name ILIKE '%walleye%';
UPDATE fish_species SET points = 85  WHERE name ILIKE '%smallmouth%';
UPDATE fish_species SET points = 75  WHERE name ILIKE '%largemouth%';
UPDATE fish_species SET points = 50  WHERE name ILIKE '%northern pike%';
UPDATE fish_species SET points = 50  WHERE name ILIKE '%spotted bass%';
UPDATE fish_species SET points = 50  WHERE name ILIKE '%striped bass%';
UPDATE fish_species SET points = 30  WHERE name ILIKE '%lake trout%';
UPDATE fish_species SET points = 25  WHERE name ILIKE '%rainbow trout%';
UPDATE fish_species SET points = 25  WHERE name ILIKE '%brown trout%';
UPDATE fish_species SET points = 25  WHERE name ILIKE '%brook trout%';
UPDATE fish_species SET points = 25  WHERE name ILIKE '%yellow perch%';
UPDATE fish_species SET points = 25  WHERE name ILIKE '%channel catfish%';
UPDATE fish_species SET points = 25  WHERE name ILIKE '%blue catfish%';
UPDATE fish_species SET points = 25  WHERE name ILIKE '%flathead catfish%';
UPDATE fish_species SET points = 20  WHERE name ILIKE '%crappie%';
UPDATE fish_species SET points = 20  WHERE name ILIKE '%bluegill%';
UPDATE fish_species SET points = 20  WHERE name ILIKE '%pumpkinseed%';
UPDATE fish_species SET points = 20  WHERE name ILIKE '%common carp%';
UPDATE fish_species SET points = 15  WHERE name ILIKE '%bullhead%';

-- Insert any species that don't exist yet so the table stays complete.
-- average_weight_kg is NOT NULL so we provide typical adult weights.
INSERT INTO fish_species (name, average_length_cm, average_weight_kg, points) VALUES
  ('Largemouth Bass',        50,   2.0,  75),
  ('Smallmouth Bass',        45,   1.5,  85),
  ('Spotted Bass',           40,   1.0,  50),
  ('Northern Pike',          80,   3.5,  50),
  ('Muskellunge (Muskie)',  110,  10.0, 150),
  ('Walleye',                55,   2.0,  90),
  ('Rainbow Trout',          50,   1.5,  25),
  ('Brown Trout',            50,   1.5,  25),
  ('Brook Trout',            35,   0.7,  25),
  ('Lake Trout',             65,   3.0,  30),
  ('Bluegill',               20,   0.2,  20),
  ('Pumpkinseed Sunfish',    20,   0.2,  20),
  ('Crappie (Black)',        30,   0.5,  20),
  ('Crappie (White)',        30,   0.5,  20),
  ('Channel Catfish',        55,   2.5,  25),
  ('Blue Catfish',           60,   4.0,  25),
  ('Flathead Catfish',       70,   5.0,  25),
  ('Yellow Perch',           25,   0.3,  25),
  ('Common Carp',            60,   4.0,  20),
  ('Striped Bass',           60,   4.5,  50),
  ('Bullhead',               30,   0.5,  15)
ON CONFLICT (name) DO UPDATE SET points = EXCLUDED.points;
