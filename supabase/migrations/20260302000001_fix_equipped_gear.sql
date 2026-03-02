-- 1. Normalize item_type to lowercase in both tables
UPDATE inventory
SET item_type = lower(item_type)
WHERE item_type != lower(item_type);

UPDATE gear_loot_table
SET item_type = lower(item_type)
WHERE item_type != lower(item_type);

-- 2. Clean up duplicate equipped items: keep only the most recently created
--    equipped item per (user_id, item_type), unequip the rest
UPDATE inventory
SET is_equipped = false
WHERE is_equipped = true
  AND id NOT IN (
    SELECT DISTINCT ON (user_id, item_type) id
    FROM inventory
    WHERE is_equipped = true
    ORDER BY user_id, item_type, created_at DESC
  );

-- 3. Prevent future duplicates at the DB level
CREATE UNIQUE INDEX IF NOT EXISTS inventory_one_equipped_per_type
  ON inventory (user_id, item_type)
  WHERE is_equipped = true;
