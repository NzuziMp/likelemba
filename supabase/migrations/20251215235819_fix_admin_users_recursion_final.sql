/*
  # Fix Admin Users Recursion - Final Fix
  
  ## Problem
  The "Super admins can manage admin users" policy still creates infinite recursion
  by joining admin_users table in its USING and WITH CHECK clauses.
  
  ## Solution
  Create a SECURITY DEFINER function to check if user is super admin.
  This function bypasses RLS so it won't cause recursion.
  
  ## Changes
  1. Create check_is_super_admin function
  2. Update the "Super admins can manage admin users" policy to use this function
*/

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION check_is_super_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_is_super_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM admin_users au
    INNER JOIN profiles p ON p.id = au.id
    WHERE au.id = user_id 
    AND p.is_admin = true
    AND au.role = 'super_admin'
  ) INTO v_is_super_admin;
  
  RETURN v_is_super_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the super admin policy
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (check_is_super_admin(auth.uid()))
  WITH CHECK (check_is_super_admin(auth.uid()));

-- Update system_settings policy to use the new function
DROP POLICY IF EXISTS "Super admins can modify system settings" ON system_settings;

CREATE POLICY "Super admins can modify system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (check_is_super_admin(auth.uid()))
  WITH CHECK (check_is_super_admin(auth.uid()));
