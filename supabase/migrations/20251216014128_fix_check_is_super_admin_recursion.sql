/*
  # Fix potential recursion in check_is_super_admin function
  
  1. Changes
    - Convert check_is_super_admin from PL/pgSQL to SQL for better performance
    - Ensure it bypasses RLS to prevent recursion issues
    - Simplify the query logic
  
  2. Technical Details
    - Uses SECURITY DEFINER to run with elevated privileges
    - STABLE marking for query optimization
    - Sets explicit search_path for security
*/

-- Replace the function to prevent potential recursion
CREATE OR REPLACE FUNCTION check_is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM admin_users au
    INNER JOIN profiles p ON p.id = au.id
    WHERE au.id = user_id 
    AND p.is_admin = true
    AND au.role = 'super_admin'
  );
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION check_is_super_admin(uuid) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION check_is_super_admin(uuid) IS 'Checks if a user is a super admin. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
