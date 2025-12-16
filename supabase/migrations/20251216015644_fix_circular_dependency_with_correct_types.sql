/*
  # Fix circular dependency between likelemba_groups and group_members
  
  1. Problem
    - likelemba_groups SELECT policy checks group_members
    - group_members policies check likelemba_groups
    - During INSERT with RETURNING, this creates infinite recursion
  
  2. Solution
    - Create SECURITY DEFINER helper functions to break the recursion
    - These functions bypass RLS and prevent circular policy evaluation
    - Replace policy conditions with function calls
  
  3. Security
    - Functions only perform specific, safe checks
    - No user input affects the queries
    - All checks validate proper ownership and permissions
*/

-- Function to check if user is creator of a group
CREATE OR REPLACE FUNCTION check_is_group_creator(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM likelemba_groups
    WHERE id = p_group_id
    AND creator_id = p_user_id
  );
$$;

-- Function to check if a member_id belongs to a group
CREATE OR REPLACE FUNCTION check_member_belongs_to_group(p_member_id text, p_group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE member_id = p_member_id
    AND group_id = p_group_id
  );
$$;

-- Drop existing policies on group_members that cause recursion
DROP POLICY IF EXISTS "Users can create members in their groups" ON group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can update members in their groups" ON group_members;
DROP POLICY IF EXISTS "Users can delete members from their groups" ON group_members;

-- Recreate policies using SECURITY DEFINER functions
CREATE POLICY "Users can create members in their groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (check_is_group_creator(group_id, auth.uid()));

CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (check_is_group_creator(group_id, auth.uid()));

CREATE POLICY "Users can update members in their groups"
  ON group_members FOR UPDATE
  TO authenticated
  USING (check_is_group_creator(group_id, auth.uid()))
  WITH CHECK (check_is_group_creator(group_id, auth.uid()));

CREATE POLICY "Users can delete members from their groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (check_is_group_creator(group_id, auth.uid()));

-- Add comments
COMMENT ON FUNCTION check_is_group_creator IS 
  'Security definer function to check group ownership without triggering RLS recursion';

COMMENT ON FUNCTION check_member_belongs_to_group IS 
  'Security definer function to check group membership without triggering RLS recursion';
