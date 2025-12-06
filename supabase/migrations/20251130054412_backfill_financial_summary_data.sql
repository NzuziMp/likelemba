/*
  # Backfill Financial Summary Data for Existing Groups

  1. Purpose
    - Update existing likelemba_groups records that have null financial summary fields
    - Calculate and populate total_per_cycle and service_fee for historical groups
    
  2. Calculations
    - total_per_cycle = monthly_amount × number_of_members
    - service_fee = number_of_members × 2
    
  3. Impact
    - Updates only records where these fields are currently null
    - Ensures all groups have complete financial information
*/

-- Backfill total_per_cycle for existing groups
UPDATE likelemba_groups
SET total_per_cycle = monthly_amount * number_of_members
WHERE total_per_cycle IS NULL;

-- Backfill service_fee for existing groups
UPDATE likelemba_groups
SET service_fee = number_of_members * 2
WHERE service_fee IS NULL;
