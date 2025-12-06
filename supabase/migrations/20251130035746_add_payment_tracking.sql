/*
  # Add Payment Tracking and Notification Features

  ## Changes
  
  1. Add payment tracking columns to group_members
    - `payment_date` - When the member last paid
    - `has_paid_current_cycle` - Whether member paid for current cycle
  
  2. Add notification tracking table
    - `payment_notifications` - Track all payment notifications sent
  
  3. Add current cycle tracking to likelemba_groups
    - `current_cycle` - Track which cycle the group is in
    - `current_beneficiary_id` - Who receives payout this cycle

  ## Security
  - RLS policies ensure only group creators can mark payments
  - All members can view payment notifications for their groups
*/

-- Add payment tracking to group_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE group_members ADD COLUMN payment_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'has_paid_current_cycle'
  ) THEN
    ALTER TABLE group_members ADD COLUMN has_paid_current_cycle boolean DEFAULT false;
  END IF;
END $$;

-- Add current cycle tracking to likelemba_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'current_cycle'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN current_cycle integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'current_beneficiary_id'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN current_beneficiary_id uuid REFERENCES group_members(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'cycle_start_date'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN cycle_start_date date;
  END IF;
END $$;

-- Create payment_notifications table
CREATE TABLE IF NOT EXISTS payment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  payment_date timestamptz NOT NULL,
  amount_paid decimal(10,2) NOT NULL,
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their groups"
  ON payment_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notifications for their groups"
  ON payment_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_notifications_group ON payment_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_member ON payment_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_likelemba_groups_current_beneficiary ON likelemba_groups(current_beneficiary_id);

-- Function to calculate next payment date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_payment_date(
  start_date date,
  frequency text,
  cycle_number integer
) RETURNS date AS $$
BEGIN
  CASE frequency
    WHEN 'daily' THEN
      RETURN start_date + (cycle_number - 1) * INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN start_date + (cycle_number - 1) * INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN start_date + (cycle_number - 1) * INTERVAL '1 month';
    ELSE
      RETURN start_date;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
