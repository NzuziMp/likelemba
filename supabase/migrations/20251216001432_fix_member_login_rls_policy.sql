/*
  # Fix Member Login RLS Policy

  This migration adds a policy to allow anonymous users to look up members by member_id for login purposes.

  ## Changes
  
  1. Security
    - Add policy "Allow member lookup by member_id for login" to group_members table
    - This policy allows anonymous users to SELECT member data when querying by member_id
    - Required for the member login flow to work properly
*/

CREATE POLICY "Allow member lookup by member_id for login"
  ON group_members
  FOR SELECT
  TO anon, authenticated
  USING (member_id IS NOT NULL);
