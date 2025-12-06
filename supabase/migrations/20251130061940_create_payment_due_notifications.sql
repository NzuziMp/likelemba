/*
  # Create Payment Due Notifications System

  1. New Table: payment_due_notifications
    - Stores notifications for group creators about upcoming payments to members
    - Tracks when payment is due, to which member, and notification status
    - Allows marking notifications as read/dismissed
    
  2. Fields
    - `id` (uuid, primary key) - Unique notification identifier
    - `group_id` (uuid, foreign key) - Reference to the likelemba group
    - `beneficiary_id` (uuid, foreign key) - Member who should receive payment
    - `payment_due_date` (date) - When the payment is due
    - `amount` (numeric) - Amount to be paid to the member
    - `cycle_number` (integer) - Which payment cycle this is for
    - `is_read` (boolean) - Whether creator has seen the notification
    - `is_dismissed` (boolean) - Whether creator dismissed the notification
    - `email_sent` (boolean) - Whether email notification was sent
    - `email_sent_at` (timestamptz) - When the email was sent
    - `created_at` (timestamptz) - When notification was created
    
  3. Security
    - Enable RLS
    - Group creators can view notifications for their groups
    - Only creators can mark notifications as read/dismissed
*/

-- Create payment due notifications table
CREATE TABLE IF NOT EXISTS payment_due_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  beneficiary_id uuid NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  payment_due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  cycle_number integer NOT NULL CHECK (cycle_number > 0),
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_due_group_id ON payment_due_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_due_date ON payment_due_notifications(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_payment_due_unread ON payment_due_notifications(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE payment_due_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Group creators can view their notifications
CREATE POLICY "Group creators can view payment due notifications"
  ON payment_due_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_due_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Group creators can update their notifications (mark as read/dismissed)
CREATE POLICY "Group creators can update payment due notifications"
  ON payment_due_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_due_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_due_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: System can insert notifications (for edge functions/triggers)
CREATE POLICY "System can insert payment due notifications"
  ON payment_due_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE payment_due_notifications IS 'Notifications to alert group creators when payments are due to members';
COMMENT ON COLUMN payment_due_notifications.payment_due_date IS 'The date when payment should be made to the beneficiary';
COMMENT ON COLUMN payment_due_notifications.is_read IS 'Whether the creator has viewed this notification';
COMMENT ON COLUMN payment_due_notifications.is_dismissed IS 'Whether the creator has dismissed/hidden this notification';
