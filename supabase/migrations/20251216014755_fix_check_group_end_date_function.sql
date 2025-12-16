/*
  # Fix check_group_end_date function to bypass RLS
  
  1. Problem
    - The check_group_end_date function tries to UPDATE likelemba_groups
    - Without SECURITY DEFINER, it runs with the caller's permissions
    - RLS policies prevent updating groups the user didn't create
    - This causes the Dashboard to fail for non-creator users
  
  2. Solution
    - Add SECURITY DEFINER to the function
    - This allows it to update any group's status regardless of who calls it
    - Safe because the function only updates status based on end_date
  
  3. Security Notes
    - Function only performs a specific, safe operation (checking end dates)
    - No user input is used in the UPDATE query
    - This is a legitimate administrative function
*/

-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.check_group_end_date()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE likelemba_groups
  SET status = 'ended'
  WHERE status = 'active'
  AND end_date <= CURRENT_DATE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.check_group_end_date() IS 
  'Automatically updates group status to ended when end_date is reached. Uses SECURITY DEFINER to bypass RLS.';
