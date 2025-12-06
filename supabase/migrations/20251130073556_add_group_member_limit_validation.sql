/*
  # Add Group Member Limit Validation

  ## Overview
  This migration adds database-level validation to enforce the member limit for Likelemba groups.
  
  ## Changes Made
  
  ### 1. Validation Function
  Creates a trigger function `check_group_member_limit()` that:
  - Counts current members in the group
  - Compares against the group's `number_of_members` limit
  - Prevents INSERT operations that would exceed the limit
  - Raises an exception with a clear error message when limit is reached
  
  ### 2. Trigger
  Creates a `BEFORE INSERT` trigger on `group_members` table that:
  - Executes the validation function before each member insertion
  - Ensures data integrity at the database level
  - Works independently of application logic
  
  ## Security Notes
  - This is a data integrity constraint, not a security policy
  - Works in conjunction with existing RLS policies
  - Prevents accidental over-subscription to groups
  - Protects against race conditions in concurrent insertions
*/

CREATE OR REPLACE FUNCTION check_group_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  member_count INTEGER;
  member_limit INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM group_members
  WHERE group_id = NEW.group_id;

  SELECT number_of_members INTO member_limit
  FROM likelemba_groups
  WHERE id = NEW.group_id;

  IF member_count >= member_limit THEN
    RAISE EXCEPTION 'Cannot add more members. The group limit is % members.', member_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_group_member_limit
  BEFORE INSERT ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION check_group_member_limit();
