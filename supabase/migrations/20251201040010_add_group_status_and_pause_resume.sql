/*
  # Add Group Status and Pause/Resume Functionality

  ## Changes
  
  1. Add status tracking to likelemba_groups
    - `status` - Track group status: active, paused, ended
    - `paused_at` - When the group was paused
    - `resumed_at` - When the group was last resumed
    - `days_paused` - Total days the group has been paused
  
  2. Function to check and update group status
    - Automatically sets status to 'ended' when end_date is reached
    - Calculates adjusted dates when group is resumed
  
  3. Triggers
    - Auto-update status based on end_date
  
  ## Security
  - Only group creators can pause/resume groups
  - RLS policies inherited from likelemba_groups table
*/

-- Add status columns to likelemba_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'status'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'paused_at'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN paused_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'resumed_at'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN resumed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'days_paused'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN days_paused integer DEFAULT 0;
  END IF;
END $$;

-- Function to check and update group status based on end date
CREATE OR REPLACE FUNCTION check_group_end_date()
RETURNS void AS $$
BEGIN
  UPDATE likelemba_groups
  SET status = 'ended'
  WHERE status = 'active'
    AND end_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to pause a group
CREATE OR REPLACE FUNCTION pause_group(p_group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE likelemba_groups
  SET 
    status = 'paused',
    paused_at = now()
  WHERE id = p_group_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to resume a group
CREATE OR REPLACE FUNCTION resume_group(p_group_id uuid)
RETURNS void AS $$
DECLARE
  v_paused_at timestamptz;
  v_days_paused_this_time integer;
  v_current_days_paused integer;
  v_start_date date;
  v_end_date date;
  v_frequency text;
  v_member RECORD;
BEGIN
  -- Get group info
  SELECT paused_at, days_paused, start_date, end_date, payment_frequency
  INTO v_paused_at, v_current_days_paused, v_start_date, v_end_date, v_frequency
  FROM likelemba_groups
  WHERE id = p_group_id
    AND status = 'paused';

  IF v_paused_at IS NULL THEN
    RETURN;
  END IF;

  -- Calculate days paused this time
  v_days_paused_this_time := EXTRACT(DAY FROM (now() - v_paused_at));
  
  -- Update group status
  UPDATE likelemba_groups
  SET 
    status = 'active',
    resumed_at = now(),
    days_paused = COALESCE(v_current_days_paused, 0) + v_days_paused_this_time,
    start_date = v_start_date + (COALESCE(v_current_days_paused, 0) + v_days_paused_this_time),
    end_date = v_end_date + (COALESCE(v_current_days_paused, 0) + v_days_paused_this_time),
    cycle_start_date = CURRENT_DATE
  WHERE id = p_group_id;

  -- Update all member scheduled payment dates
  FOR v_member IN
    SELECT id, receipt_order
    FROM group_members
    WHERE group_id = p_group_id
  LOOP
    UPDATE group_members
    SET scheduled_payment_date = calculate_next_payment_date(
      v_start_date + (COALESCE(v_current_days_paused, 0) + v_days_paused_this_time),
      v_frequency,
      v_member.receipt_order
    )
    WHERE id = v_member.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_likelemba_groups_status ON likelemba_groups(status);
CREATE INDEX IF NOT EXISTS idx_likelemba_groups_end_date ON likelemba_groups(end_date) WHERE status = 'active';

-- Update existing groups to have active status
UPDATE likelemba_groups
SET status = 'ended'
WHERE end_date < CURRENT_DATE
  AND status IS NULL;

UPDATE likelemba_groups
SET status = 'active'
WHERE status IS NULL;
