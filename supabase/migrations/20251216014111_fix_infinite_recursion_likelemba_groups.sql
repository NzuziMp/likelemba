/*
  # Fix infinite recursion in likelemba_groups policies
  
  1. Problem
    - When creating a group, PostgreSQL evaluates all SELECT policies
    - The "Admins can view all groups" policy calls check_is_admin()
    - This causes infinite recursion during INSERT operations
  
  2. Solution
    - Replace check_is_admin function with a simpler SQL version that bypasses RLS
    - Use CREATE OR REPLACE to update the function without dropping dependencies
  
  3. Technical Details
    - Changes from PL/pgSQL to SQL language for better performance
    - SECURITY DEFINER ensures it runs with elevated privileges
    - STABLE marking allows query optimization
*/

-- Replace the function without dropping (preserves dependencies)
CREATE OR REPLACE FUNCTION check_is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = user_id LIMIT 1),
    false
  );
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION check_is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_admin(uuid) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION check_is_admin(uuid) IS 'Checks if a user is an admin. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';
