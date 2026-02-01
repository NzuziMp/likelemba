/*
  # Fix Member Payment History Access and Backfill Data

  1. Changes
    - Add public access policy for member portal users (they don't have auth.uid())
    - Backfill payment history data for all existing members and cycles
    
  2. Security
    - Allow anonymous/public users to view payment history (member portal uses session tokens, not auth)
    - Keep existing authenticated user policies
    
  3. Data Backfill
    - Create payment history records for all members in all groups
    - Mark payments as paid/unpaid based on has_paid_current_cycle flag
    - Set payment dates from group_members.payment_date where available
*/

-- Add policy for public/anonymous access (for member portal)
-- Member portal authenticates via session tokens, not Supabase auth
CREATE POLICY "Allow public read access for member portal"
  ON member_payment_history
  FOR SELECT
  TO public
  USING (true);

-- Backfill payment history for all existing groups and cycles
DO $$
DECLARE
  group_record RECORD;
  member_record RECORD;
  cycle_num INTEGER;
BEGIN
  -- Loop through all groups
  FOR group_record IN 
    SELECT id, current_cycle, number_of_members, monthly_amount
    FROM likelemba_groups
  LOOP
    -- Loop through all cycles for this group (1 to current_cycle)
    FOR cycle_num IN 1..COALESCE(group_record.current_cycle, 1)
    LOOP
      -- Loop through all members in this group
      FOR member_record IN
        SELECT id, membership_amount, has_paid_current_cycle, payment_date
        FROM group_members
        WHERE group_id = group_record.id
      LOOP
        -- Insert payment history record
        INSERT INTO member_payment_history (
          group_id,
          member_id,
          cycle_number,
          amount_due,
          amount_paid,
          is_paid,
          payment_date
        )
        VALUES (
          group_record.id,
          member_record.id,
          cycle_num,
          member_record.membership_amount,
          CASE 
            WHEN cycle_num < group_record.current_cycle THEN member_record.membership_amount
            WHEN cycle_num = group_record.current_cycle AND member_record.has_paid_current_cycle THEN member_record.membership_amount
            ELSE 0
          END,
          CASE 
            WHEN cycle_num < group_record.current_cycle THEN true
            WHEN cycle_num = group_record.current_cycle THEN member_record.has_paid_current_cycle
            ELSE false
          END,
          CASE 
            WHEN cycle_num = group_record.current_cycle AND member_record.has_paid_current_cycle THEN member_record.payment_date
            ELSE NULL
          END
        )
        ON CONFLICT (group_id, member_id, cycle_number) DO UPDATE
        SET
          amount_paid = EXCLUDED.amount_paid,
          is_paid = EXCLUDED.is_paid,
          payment_date = EXCLUDED.payment_date;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Update the create_payment_records_for_cycle function to be called automatically
-- This ensures new cycles get payment records created
CREATE OR REPLACE FUNCTION create_payment_records_for_new_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When current_cycle is updated, create payment records for all members
  IF NEW.current_cycle > OLD.current_cycle THEN
    INSERT INTO member_payment_history (group_id, member_id, cycle_number, amount_due)
    SELECT 
      NEW.id,
      gm.id,
      NEW.current_cycle,
      gm.membership_amount
    FROM group_members gm
    WHERE gm.group_id = NEW.id
    ON CONFLICT (group_id, member_id, cycle_number) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create payment records when cycle advances
DROP TRIGGER IF EXISTS trigger_create_payment_records_on_cycle_change ON likelemba_groups;
CREATE TRIGGER trigger_create_payment_records_on_cycle_change
  AFTER UPDATE OF current_cycle ON likelemba_groups
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_records_for_new_cycle();
