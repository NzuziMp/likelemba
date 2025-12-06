/*
  # Add Scheduled Payment Dates for Members

  ## Changes
  
  1. Add scheduled_payment_date to group_members
    - Each member gets their own payment date based on receipt_order
    - This date is calculated based on group start_date and payment_frequency
  
  2. Function to populate scheduled dates
    - Automatically calculates payment dates for existing members
  
  ## Security
  - No new RLS policies needed (inherits from group_members table)
*/

-- Add scheduled_payment_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'scheduled_payment_date'
  ) THEN
    ALTER TABLE group_members ADD COLUMN scheduled_payment_date date;
  END IF;
END $$;

-- Function to update scheduled payment dates for a group's members
CREATE OR REPLACE FUNCTION update_member_scheduled_dates(p_group_id uuid)
RETURNS void AS $$
DECLARE
  v_start_date date;
  v_frequency text;
  v_member RECORD;
BEGIN
  -- Get group info
  SELECT start_date, payment_frequency
  INTO v_start_date, v_frequency
  FROM likelemba_groups
  WHERE id = p_group_id;

  -- Update each member's scheduled date
  FOR v_member IN
    SELECT id, receipt_order
    FROM group_members
    WHERE group_id = p_group_id
  LOOP
    UPDATE group_members
    SET scheduled_payment_date = calculate_next_payment_date(
      v_start_date,
      v_frequency,
      v_member.receipt_order
    )
    WHERE id = v_member.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set scheduled_payment_date when a new member is added
CREATE OR REPLACE FUNCTION set_member_scheduled_date()
RETURNS TRIGGER AS $$
DECLARE
  v_start_date date;
  v_frequency text;
BEGIN
  -- Get group info
  SELECT start_date, payment_frequency
  INTO v_start_date, v_frequency
  FROM likelemba_groups
  WHERE id = NEW.group_id;

  -- Set scheduled date based on receipt order
  NEW.scheduled_payment_date := calculate_next_payment_date(
    v_start_date,
    v_frequency,
    NEW.receipt_order
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_set_member_scheduled_date ON group_members;
CREATE TRIGGER trigger_set_member_scheduled_date
  BEFORE INSERT OR UPDATE OF receipt_order
  ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION set_member_scheduled_date();

-- Populate scheduled dates for existing members
DO $$
DECLARE
  v_group RECORD;
BEGIN
  FOR v_group IN SELECT DISTINCT id FROM likelemba_groups
  LOOP
    PERFORM update_member_scheduled_dates(v_group.id);
  END LOOP;
END $$;
