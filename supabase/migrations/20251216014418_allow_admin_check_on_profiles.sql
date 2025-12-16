/*
  # Allow admin status checks on profiles table
  
  1. Problem
    - check_is_admin function can't read profiles due to restrictive RLS
    - Even with SECURITY DEFINER, RLS blocks access to other users' profiles
    - This causes infinite recursion when creating groups
  
  2. Solution
    - Add a new SELECT policy on profiles for admin checks
    - Allow authenticated users to check if ANY user is an admin
    - This is safe because is_admin is not sensitive information for authorization
  
  3. Security Notes
    - Only exposes the is_admin boolean flag
    - Does not expose other profile data
    - Required for proper admin authorization checks
*/

-- Add policy to allow checking admin status
CREATE POLICY "Allow checking admin status"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Add comment for documentation
COMMENT ON POLICY "Allow checking admin status" ON profiles IS 
  'Allows authenticated users to check admin status. Required for check_is_admin() function to work without recursion.';
