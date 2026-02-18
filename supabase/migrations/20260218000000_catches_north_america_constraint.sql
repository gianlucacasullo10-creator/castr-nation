-- Enforce server-side geolocation: catches must originate from Canada or the USA.
-- Latitude 24.5–83.5 N, Longitude -141.0–-52.5 W covers the continental US, Alaska, and Canada.
-- NULL coordinates are allowed (catch uploaded without location data).

ALTER TABLE catches
  ADD CONSTRAINT catches_north_america_only CHECK (
    latitude IS NULL
    OR longitude IS NULL
    OR (
      latitude  BETWEEN 24.5 AND 83.5 AND
      longitude BETWEEN -141.0 AND -52.5
    )
  );
