/*
  # Fix Profiles Table Infinite Recursion
  
  ## Problem
  The admin policies on profiles table query profiles.is_admin, creating infinite recursion.
  
  ## Solution
  1. Remove admin policies from profiles table
  2. Keep only the original simple policies (users can view/update own profile)
  3. Create SECURITY DEFINER function to check admin status (bypasses RLS)
  4. Update all other tables to use this function instead
  
  ## Security
  The function is SECURITY DEFINER so it bypasses RLS when checking admin status.
  This is safe because it only returns true/false, not data.
*/

-- Drop the problematic admin policies on profiles
DROP POLICY IF EXISTS "Users with is_admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users with is_admin can update any profile" ON profiles;

-- The original policies remain:
-- "Users can view own profile" - allows auth.uid() = id
-- "Users can update own profile" - allows auth.uid() = id
-- "Users can insert own profile" - allows auth.uid() = id

-- Create a SECURITY DEFINER function to check if user is admin
-- This function bypasses RLS so it won't cause recursion
CREATE OR REPLACE FUNCTION check_is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin_users policies to use the function
DROP POLICY IF EXISTS "Users with is_admin can view admin users" ON admin_users;

CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (check_is_admin(auth.uid()));

-- Update admin_activity_log policies
DROP POLICY IF EXISTS "Users with is_admin can view activity logs" ON admin_activity_log;
DROP POLICY IF EXISTS "Users with is_admin can create activity logs" ON admin_activity_log;

CREATE POLICY "Admins can view activity logs"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (check_is_admin(auth.uid()));

CREATE POLICY "Admins can create activity logs"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (check_is_admin(auth.uid()));

-- Update system_settings policies
DROP POLICY IF EXISTS "Users with is_admin can view system settings" ON system_settings;

CREATE POLICY "Admins can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (check_is_admin(auth.uid()));

-- Update contact_messages policies
DROP POLICY IF EXISTS "Users with is_admin can view all contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Users with is_admin can update contact messages" ON contact_messages;

CREATE POLICY "Admins can view all contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (check_is_admin(auth.uid()));

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (check_is_admin(auth.uid()))
  WITH CHECK (check_is_admin(auth.uid()));

-- Update likelemba_groups policy
DROP POLICY IF EXISTS "Users with is_admin can view all groups" ON likelemba_groups;

CREATE POLICY "Admins can view all groups"
  ON likelemba_groups FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    check_is_admin(auth.uid())
  );
