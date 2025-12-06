/*
  # Add Service Fee Payment Tracking

  ## Overview
  Adds fields to track service fee payment deadline and payment method for Likelemba groups.

  ## Changes
  1. Add Fields to `likelemba_groups` table:
    - `service_fee_deadline` (timestamptz) - Deadline for service fee payment (2 weeks from group creation)
    - `service_fee_payment_method` (text) - Payment method used (paypal, interac, cash)
    - `service_fee_paid_at` (timestamptz) - When the service fee was paid

  ## Notes
  - Service fee deadline is automatically set to 2 weeks from group creation
  - Main member (group creator) can pay via PayPal using paypal.me/MpingiPro
  - Payment can be marked as paid after confirmation
*/

-- Add service fee payment tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'service_fee_deadline'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN service_fee_deadline timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'service_fee_payment_method'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN service_fee_payment_method text CHECK (service_fee_payment_method IN ('paypal', 'interac', 'cash'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'service_fee_paid_at'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN service_fee_paid_at timestamptz;
  END IF;
END $$;

-- Set default deadline for existing groups (2 weeks from creation)
UPDATE likelemba_groups
SET service_fee_deadline = created_at + INTERVAL '2 weeks'
WHERE service_fee_deadline IS NULL;

-- Create function to automatically set service fee deadline on group creation
CREATE OR REPLACE FUNCTION set_service_fee_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_fee_deadline IS NULL THEN
    NEW.service_fee_deadline = NEW.created_at + INTERVAL '2 weeks';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set service fee deadline
DROP TRIGGER IF EXISTS set_service_fee_deadline_trigger ON likelemba_groups;
CREATE TRIGGER set_service_fee_deadline_trigger
  BEFORE INSERT ON likelemba_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_service_fee_deadline();
