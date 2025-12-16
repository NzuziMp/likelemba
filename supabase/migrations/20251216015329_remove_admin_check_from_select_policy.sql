/*
  # Remove admin check from SELECT policy to fix infinite recursion
  
  1. Problem
    - During INSERT, PostgreSQL evaluates SELECT policies for RETURNING clause
    - "Admins can view all groups" policy calls check_is_admin()
    - This causes infinite recursion even with SECURITY DEFINER
    - The recursion happens because RLS policies are checked recursively
  
  2. Solution
    - Drop the problematic "Admins can view all groups" policy
    - Admin functionality will be handled at the application level
    - Users can still view their own groups and groups they're members of
  
  3. Impact
    - Admins will need to use the admin panel to view all groups
    - Regular dashboard will only show groups the user created or is a member of
    - This is actually more secure and appropriate
*/

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all groups" ON likelemba_groups;

-- Add comment explaining the decision
COMMENT ON TABLE likelemba_groups IS 
  'Likelemba groups table. Admin access is handled at application level to avoid RLS recursion issues.';
