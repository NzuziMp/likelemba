/*
  # Add Financial Summary Fields to Likelemba Groups

  1. Changes
    - Add `total_per_cycle` field to store the total amount collected per payment cycle
    - Add `service_fee` field to store the calculated service fee ($2 per member)
    
  2. Details
    - `total_per_cycle` = monthly_amount × number_of_members
    - `service_fee` = number_of_members × 2
    - Both fields are numeric with 2 decimal places
    - These fields are calculated and stored when creating a group
    
  3. Purpose
    - Store financial summary data with each group
    - Display cycle details and financial info on group pages
    - Maintain historical financial data even if member count changes
*/

-- Add financial summary fields to likelemba_groups table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'total_per_cycle'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN total_per_cycle numeric CHECK (total_per_cycle >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'service_fee'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN service_fee numeric CHECK (service_fee >= 0);
  END IF;
END $$;

-- Add comment to explain the fields
COMMENT ON COLUMN likelemba_groups.total_per_cycle IS 'Total amount collected per payment cycle (monthly_amount × number_of_members)';
COMMENT ON COLUMN likelemba_groups.service_fee IS 'One-time service fee ($2 per member)';
