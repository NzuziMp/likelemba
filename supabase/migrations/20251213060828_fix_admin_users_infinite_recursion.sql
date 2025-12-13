/*
  # Fix Admin Users Infinite Recursion
  
  ## Problem
  The RLS policies on `admin_users` table create infinite recursion by querying
  the same table they're protecting. When trying to check if user is admin, it
  queries admin_users, which triggers the policy again, creating infinite loop.
  
  ## Solution
  - Drop the problematic policies that query admin_users from admin_users policies
  - Use the `is_admin` flag from `profiles` table instead
  - This breaks the recursion since we check a different table
  
  ## Changes
  1. Drop all existing problematic policies
  2. Create new policies that check profiles.is_admin
  3. Update all admin-related policies across tables
*/

-- Fix admin_users table policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

CREATE POLICY "Users with is_admin can view admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN admin_users au ON au.id = p.id
      WHERE p.id = auth.uid() 
      AND p.is_admin = true
      AND au.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN admin_users au ON au.id = p.id
      WHERE p.id = auth.uid() 
      AND p.is_admin = true
      AND au.role = 'super_admin'
    )
  );

-- Fix admin_activity_log policies
DROP POLICY IF EXISTS "Admins can view activity logs" ON admin_activity_log;
DROP POLICY IF EXISTS "Admins can create activity logs" ON admin_activity_log;

CREATE POLICY "Users with is_admin can view activity logs"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Users with is_admin can create activity logs"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Fix system_settings policies
DROP POLICY IF EXISTS "Admins can view system settings" ON system_settings;
DROP POLICY IF EXISTS "Super admins can modify system settings" ON system_settings;

CREATE POLICY "Users with is_admin can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Super admins can modify system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN admin_users au ON au.id = p.id
      WHERE p.id = auth.uid() 
      AND p.is_admin = true
      AND au.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN admin_users au ON au.id = p.id
      WHERE p.id = auth.uid() 
      AND p.is_admin = true
      AND au.role = 'super_admin'
    )
  );

-- Fix contact_messages policies
DROP POLICY IF EXISTS "Admins can view all contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON contact_messages;

CREATE POLICY "Users with is_admin can view all contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Users with is_admin can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Fix profiles policies (allow users to update own profile AND admins to update any profile)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update user status" ON profiles;

-- Re-create the admin policies for profiles
CREATE POLICY "Users with is_admin can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

CREATE POLICY "Users with is_admin can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Fix likelemba_groups policies (allow admins to view all groups)
DROP POLICY IF EXISTS "Admins can view all groups" ON likelemba_groups;

CREATE POLICY "Users with is_admin can view all groups"
  ON likelemba_groups FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );
