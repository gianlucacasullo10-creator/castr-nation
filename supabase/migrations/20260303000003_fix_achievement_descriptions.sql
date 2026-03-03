-- Fix achievement descriptions that referenced impossible per-catch point thresholds.
-- These now reflect total accumulated catch points across all a user's catches.

UPDATE achievements
  SET description = 'Accumulate 500 total catch points across all your catches'
WHERE criteria = 'catch_500_points';

UPDATE achievements
  SET description = 'Accumulate 1,000 total catch points across all your catches'
WHERE criteria = 'catch_1000_points';
