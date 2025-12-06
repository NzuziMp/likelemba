/*
  # Create Member Payment History System

  1. New Table: member_payment_history
    - Tracks individual member payments for each cycle
    - Records when members pay their monthly/weekly/daily contribution
    - Allows group creator to check off payments
    - Stores payment confirmation details
    
  2. Fields
    - `id` (uuid, primary key) - Unique payment record identifier
    - `group_id` (uuid, foreign key) - Reference to the likelemba group
    - `member_id` (uuid, foreign key) - Reference to the member
    - `cycle_number` (integer) - Which payment cycle this is for
    - `amount_due` (numeric) - Amount member should pay this cycle
    - `amount_paid` (numeric) - Actual amount paid
    - `payment_date` (timestamptz) - When payment was made
    - `marked_paid_by` (uuid) - Who marked this as paid (creator)
    - `is_paid` (boolean) - Payment status
    - `reminder_sent` (boolean) - Whether reminder email was sent
    - `reminder_sent_at` (timestamptz) - When reminder was sent
    - `notes` (text) - Optional notes about the payment
    - `created_at` (timestamptz) - Record creation timestamp
    
  3. Security
    - Enable RLS
    - Group creators can view and manage payments for their groups
    - Members can view their own payment records
*/

-- Create member payment history table
CREATE TABLE IF NOT EXISTS member_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL CHECK (cycle_number > 0),
  amount_due numeric NOT NULL CHECK (amount_due > 0),
  amount_paid numeric DEFAULT 0 CHECK (amount_paid >= 0),
  payment_date timestamptz,
  marked_paid_by uuid REFERENCES profiles(id),
  is_paid boolean DEFAULT false,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, member_id, cycle_number)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_history_group_cycle ON member_payment_history(group_id, cycle_number);
CREATE INDEX IF NOT EXISTS idx_payment_history_member ON member_payment_history(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_unpaid ON member_payment_history(is_paid) WHERE is_paid = false;

-- Enable RLS
ALTER TABLE member_payment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Group creators can view payment history for their groups
CREATE POLICY "Group creators can view payment history"
  ON member_payment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = member_payment_history.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Group creators can update payment history for their groups
CREATE POLICY "Group creators can update payment history"
  ON member_payment_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = member_payment_history.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = member_payment_history.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Group creators can insert payment records
CREATE POLICY "Group creators can insert payment history"
  ON member_payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = member_payment_history.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Members can view their own payment history
CREATE POLICY "Members can view own payment history"
  ON member_payment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.id = member_payment_history.member_id
      AND group_members.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Function to automatically create payment records for a new cycle
CREATE OR REPLACE FUNCTION create_payment_records_for_cycle(
  p_group_id uuid,
  p_cycle_number integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO member_payment_history (group_id, member_id, cycle_number, amount_due)
  SELECT 
    p_group_id,
    gm.id,
    p_cycle_number,
    gm.membership_amount
  FROM group_members gm
  WHERE gm.group_id = p_group_id
  ON CONFLICT (group_id, member_id, cycle_number) DO NOTHING;
END;
$$;

-- Add helpful comments
COMMENT ON TABLE member_payment_history IS 'Tracks member payments for each cycle in a group';
COMMENT ON COLUMN member_payment_history.is_paid IS 'Whether the member has paid for this cycle';
COMMENT ON COLUMN member_payment_history.reminder_sent IS 'Whether a payment reminder was sent to this member';
COMMENT ON FUNCTION create_payment_records_for_cycle IS 'Creates payment records for all members in a group for a specific cycle';
