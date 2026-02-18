-- Drop the North America geolocation constraint so catches worldwide are accepted.
ALTER TABLE catches DROP CONSTRAINT IF EXISTS catches_north_america_only;
