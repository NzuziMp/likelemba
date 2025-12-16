/*
  # Fix Member Portal Group Access

  1. Changes
    - Add RLS policy to allow members to view groups they belong to via session tokens
    - Add RLS policy to allow members to view payment history via session tokens
    
  2. Security
    - Members can only view groups where they have a valid session
    - Members can only view their own payment history
*/

-- Allow members to view groups they belong to via session tokens
CREATE POLICY "Members can view groups they belong to via session"
  ON likelemba_groups
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM group_members gm
      INNER JOIN member_id_sessions mis ON mis.member_id = gm.member_id
      WHERE gm.group_id = likelemba_groups.id
      AND mis.expires_at > now()
    )
  );

-- Allow members to view their own payment history via session tokens
CREATE POLICY "Members can view own payment history via session"
  ON member_payment_history
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM group_members gm
      INNER JOIN member_id_sessions mis ON mis.member_id = gm.member_id
      WHERE gm.id = member_payment_history.member_id
      AND mis.expires_at > now()
    )
  );
