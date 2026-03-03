-- River Master is a lure, not a rod. Fix item_type in both tables.

UPDATE gear_loot_table
SET item_type = 'lure'
WHERE item_name ILIKE '%River Master%'
  AND item_type != 'lure';

UPDATE inventory
SET item_type = 'lure'
WHERE item_name ILIKE '%River Master%'
  AND item_type != 'lure';
