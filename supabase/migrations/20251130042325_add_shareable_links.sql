/*
  # Add Shareable Links Feature

  1. New Tables
    - `group_share_links`
      - `id` (uuid, primary key)
      - `group_id` (uuid, foreign key to likelemba_groups)
      - `share_token` (text, unique) - Unique token for the shareable link
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz, nullable) - Optional expiration date
      - `is_active` (boolean) - Whether the link is active

  2. Security
    - Enable RLS on `group_share_links` table
    - Add policy for Maman Likelemba to create and manage share links
    - Public read access for active share links (for viewing shared data)

  3. Changes
    - Allow public read access to group and member data when accessed via valid share link
*/

-- Create group_share_links table
CREATE TABLE IF NOT EXISTS group_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE group_share_links ENABLE ROW LEVEL SECURITY;

-- Policy: Maman Likelemba can create share links for their groups
CREATE POLICY "Maman can create share links for their groups"
  ON group_share_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Maman can view share links for their groups
CREATE POLICY "Maman can view their group share links"
  ON group_share_links
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Maman can update share links for their groups
CREATE POLICY "Maman can update their group share links"
  ON group_share_links
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Maman can delete share links for their groups
CREATE POLICY "Maman can delete their group share links"
  ON group_share_links
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Anyone with valid token can view active share links (for validation)
CREATE POLICY "Public can view active share links by token"
  ON group_share_links
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Create function to get shared group data
CREATE OR REPLACE FUNCTION get_shared_group_data(token text)
RETURNS TABLE (
  group_id uuid,
  group_name text,
  amount_per_member numeric,
  payment_frequency text,
  start_date date,
  member_id uuid,
  member_name text,
  member_email text,
  member_phone text,
  receipt_order int,
  payment_id uuid,
  payment_date timestamptz,
  amount_paid numeric,
  cycle_number int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lg.id as group_id,
    lg.name as group_name,
    lg.monthly_amount as amount_per_member,
    lg.payment_frequency,
    lg.start_date,
    gm.id as member_id,
    gm.full_name as member_name,
    gm.email as member_email,
    gm.phone as member_phone,
    gm.receipt_order,
    mp.id as payment_id,
    mp.payment_date,
    mp.amount_paid,
    mp.cycle_number
  FROM group_share_links gsl
  JOIN likelemba_groups lg ON lg.id = gsl.group_id
  JOIN group_members gm ON gm.group_id = lg.id
  LEFT JOIN member_payments mp ON mp.member_id = gm.id
  WHERE gsl.share_token = token
    AND gsl.is_active = true
    AND (gsl.expires_at IS NULL OR gsl.expires_at > now())
  ORDER BY gm.receipt_order, mp.payment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_shared_group_data(text) TO anon, authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_group_share_links_token ON group_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_group_share_links_group_id ON group_share_links(group_id);
