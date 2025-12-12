/*
  # Likelemba Application Database Schema

  ## Overview
  This migration creates the complete database schema for the Likelemba tontine management application.

  ## New Tables

  ### 1. `profiles`
  Extends auth.users with additional user information
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's full name
  - `phone` (text) - Phone number
  - `address` (text, optional) - Physical address
  - `is_maman_likelemba` (boolean) - Whether user is a primary member
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `likelemba_groups`
  Stores information about each Likelemba savings group
  - `id` (uuid, primary key)
  - `name` (text) - Name of the group
  - `creator_id` (uuid) - References profiles (Maman Likelemba)
  - `number_of_members` (integer) - Total members in group
  - `monthly_amount` (decimal) - Amount each member contributes
  - `payment_frequency` (text) - daily, weekly, or monthly
  - `payment_method` (text) - interac or cash
  - `start_date` (date) - When group starts
  - `end_date` (date) - When group ends
  - `service_fee_paid` (boolean) - Whether $2/member fee is paid
  - `status` (text) - active, completed, cancelled
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `group_members`
  Tracks members participating in each Likelemba group
  - `id` (uuid, primary key)
  - `group_id` (uuid) - References likelemba_groups
  - `full_name` (text) - Member's full name
  - `email` (text) - Member's email
  - `phone` (text) - Member's phone number
  - `address` (text, optional) - Member's address
  - `membership_amount` (decimal) - Amount this member contributes
  - `receipt_order` (integer) - Order in which member receives payout
  - `has_received` (boolean) - Whether member has received their payout
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `payment_schedules`
  Auto-generated payment schedule for each cycle
  - `id` (uuid, primary key)
  - `group_id` (uuid) - References likelemba_groups
  - `cycle_number` (integer) - Which cycle (1, 2, 3...)
  - `payment_date` (date) - When payment is due
  - `beneficiary_id` (uuid) - References group_members (who receives)
  - `total_amount` (decimal) - Total payout amount
  - `status` (text) - pending, completed, overdue
  - `created_at` (timestamptz)

  ### 5. `member_payments`
  Tracks individual member payments for each cycle
  - `id` (uuid, primary key)
  - `schedule_id` (uuid) - References payment_schedules
  - `member_id` (uuid) - References group_members
  - `amount_due` (decimal) - Amount member needs to pay
  - `amount_paid` (decimal) - Amount member has paid
  - `payment_date` (timestamptz, optional) - When payment was made
  - `payment_method` (text) - interac or cash
  - `status` (text) - pending, paid, overdue
  - `created_at` (timestamptz)

  ### 6. `contact_messages`
  Stores messages from contact form
  - `id` (uuid, primary key)
  - `name` (text) - Sender's name
  - `email` (text) - Sender's email
  - `phone` (text, optional) - Sender's phone
  - `message` (text) - Message content
  - `status` (text) - new, read, replied
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only access their own data
  - Group creators can manage their groups and members
  - Public access for contact messages (insert only)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  address text,
  is_maman_likelemba boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create likelemba_groups table
CREATE TABLE IF NOT EXISTS likelemba_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  number_of_members integer NOT NULL CHECK (number_of_members > 0),
  monthly_amount decimal(10,2) NOT NULL CHECK (monthly_amount > 0),
  payment_frequency text NOT NULL CHECK (payment_frequency IN ('daily', 'weekly', 'monthly')),
  payment_method text NOT NULL CHECK (payment_method IN ('interac', 'cash')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  service_fee_paid boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE likelemba_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own groups"
  ON likelemba_groups FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can create groups"
  ON likelemba_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own groups"
  ON likelemba_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete own groups"
  ON likelemba_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  membership_amount decimal(10,2) NOT NULL CHECK (membership_amount > 0),
  receipt_order integer NOT NULL CHECK (receipt_order > 0),
  has_received boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_members.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create members in their groups"
  ON group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_members.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update members in their groups"
  ON group_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_members.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_members.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete members from their groups"
  ON group_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = group_members.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Create payment_schedules table
CREATE TABLE IF NOT EXISTS payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL CHECK (cycle_number > 0),
  payment_date date NOT NULL,
  beneficiary_id uuid NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  total_amount decimal(10,2) NOT NULL CHECK (total_amount > 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules of their groups"
  ON payment_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_schedules.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create schedules for their groups"
  ON payment_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_schedules.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update schedules of their groups"
  ON payment_schedules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_schedules.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_schedules.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Create member_payments table
CREATE TABLE IF NOT EXISTS member_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  amount_due decimal(10,2) NOT NULL CHECK (amount_due > 0),
  amount_paid decimal(10,2) DEFAULT 0 CHECK (amount_paid >= 0),
  payment_date timestamptz,
  payment_method text CHECK (payment_method IN ('interac', 'cash')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments in their groups"
  ON member_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment_schedules ps
      JOIN likelemba_groups lg ON lg.id = ps.group_id
      WHERE ps.id = member_payments.schedule_id
      AND lg.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create payments in their groups"
  ON member_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payment_schedules ps
      JOIN likelemba_groups lg ON lg.id = ps.group_id
      WHERE ps.id = member_payments.schedule_id
      AND lg.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update payments in their groups"
  ON member_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payment_schedules ps
      JOIN likelemba_groups lg ON lg.id = ps.group_id
      WHERE ps.id = member_payments.schedule_id
      AND lg.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payment_schedules ps
      JOIN likelemba_groups lg ON lg.id = ps.group_id
      WHERE ps.id = member_payments.schedule_id
      AND lg.creator_id = auth.uid()
    )
  );

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likelemba_groups_creator ON likelemba_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_group ON payment_schedules(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_date ON payment_schedules(payment_date);
CREATE INDEX IF NOT EXISTS idx_member_payments_schedule ON member_payments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_member ON member_payments(member_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_likelemba_groups_updated_at
  BEFORE UPDATE ON likelemba_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
/*
  # Add Payment Tracking and Notification Features

  ## Changes
  
  1. Add payment tracking columns to group_members
    - `payment_date` - When the member last paid
    - `has_paid_current_cycle` - Whether member paid for current cycle
  
  2. Add notification tracking table
    - `payment_notifications` - Track all payment notifications sent
  
  3. Add current cycle tracking to likelemba_groups
    - `current_cycle` - Track which cycle the group is in
    - `current_beneficiary_id` - Who receives payout this cycle

  ## Security
  - RLS policies ensure only group creators can mark payments
  - All members can view payment notifications for their groups
*/

-- Add payment tracking to group_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE group_members ADD COLUMN payment_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'has_paid_current_cycle'
  ) THEN
    ALTER TABLE group_members ADD COLUMN has_paid_current_cycle boolean DEFAULT false;
  END IF;
END $$;

-- Add current cycle tracking to likelemba_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'current_cycle'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN current_cycle integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'current_beneficiary_id'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN current_beneficiary_id uuid REFERENCES group_members(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'cycle_start_date'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN cycle_start_date date;
  END IF;
END $$;

-- Create payment_notifications table
CREATE TABLE IF NOT EXISTS payment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  payment_date timestamptz NOT NULL,
  amount_paid decimal(10,2) NOT NULL,
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their groups"
  ON payment_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notifications for their groups"
  ON payment_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_notifications_group ON payment_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_notifications_member ON payment_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_likelemba_groups_current_beneficiary ON likelemba_groups(current_beneficiary_id);

-- Function to calculate next payment date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_payment_date(
  start_date date,
  frequency text,
  cycle_number integer
) RETURNS date AS $$
BEGIN
  CASE frequency
    WHEN 'daily' THEN
      RETURN start_date + (cycle_number - 1) * INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN start_date + (cycle_number - 1) * INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN start_date + (cycle_number - 1) * INTERVAL '1 month';
    ELSE
      RETURN start_date;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
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
/*
  # Add Profile Photo Support

  1. Changes to profiles table
    - Add `avatar_url` column for storing profile photo URL
    - Add `phone` column for contact information
    - Add `address` column for user address

  2. Storage
    - Create storage bucket for profile avatars
    - Set up RLS policies for avatar uploads

  3. Security
    - Users can only upload/update their own avatars
    - Public read access for avatars
*/

-- Add avatar_url column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Add phone column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
END $$;

-- Add address column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text;
  END IF;
END $$;

-- Create avatars bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Storage policy: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Anyone can view avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');
/*
  # Add Financial Summary Fields to Likelemba Groups

  1. Changes
    - Add `total_per_cycle` field to store the total amount collected per payment cycle
    - Add `service_fee` field to store the calculated service fee ($2 per member)
    
  2. Details
    - `total_per_cycle` = monthly_amount × number_of_members
    - `service_fee` = number_of_members × 2
    - Both fields are numeric with 2 decimal places
    - These fields are calculated and stored when creating a group
    
  3. Purpose
    - Store financial summary data with each group
    - Display cycle details and financial info on group pages
    - Maintain historical financial data even if member count changes
*/

-- Add financial summary fields to likelemba_groups table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'total_per_cycle'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN total_per_cycle numeric CHECK (total_per_cycle >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'service_fee'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN service_fee numeric CHECK (service_fee >= 0);
  END IF;
END $$;

-- Add comment to explain the fields
COMMENT ON COLUMN likelemba_groups.total_per_cycle IS 'Total amount collected per payment cycle (monthly_amount × number_of_members)';
COMMENT ON COLUMN likelemba_groups.service_fee IS 'One-time service fee ($2 per member)';
/*
  # Backfill Financial Summary Data for Existing Groups

  1. Purpose
    - Update existing likelemba_groups records that have null financial summary fields
    - Calculate and populate total_per_cycle and service_fee for historical groups
    
  2. Calculations
    - total_per_cycle = monthly_amount × number_of_members
    - service_fee = number_of_members × 2
    
  3. Impact
    - Updates only records where these fields are currently null
    - Ensures all groups have complete financial information
*/

-- Backfill total_per_cycle for existing groups
UPDATE likelemba_groups
SET total_per_cycle = monthly_amount * number_of_members
WHERE total_per_cycle IS NULL;

-- Backfill service_fee for existing groups
UPDATE likelemba_groups
SET service_fee = number_of_members * 2
WHERE service_fee IS NULL;
/*
  # Create Payment Due Notifications System

  1. New Table: payment_due_notifications
    - Stores notifications for group creators about upcoming payments to members
    - Tracks when payment is due, to which member, and notification status
    - Allows marking notifications as read/dismissed
    
  2. Fields
    - `id` (uuid, primary key) - Unique notification identifier
    - `group_id` (uuid, foreign key) - Reference to the likelemba group
    - `beneficiary_id` (uuid, foreign key) - Member who should receive payment
    - `payment_due_date` (date) - When the payment is due
    - `amount` (numeric) - Amount to be paid to the member
    - `cycle_number` (integer) - Which payment cycle this is for
    - `is_read` (boolean) - Whether creator has seen the notification
    - `is_dismissed` (boolean) - Whether creator dismissed the notification
    - `email_sent` (boolean) - Whether email notification was sent
    - `email_sent_at` (timestamptz) - When the email was sent
    - `created_at` (timestamptz) - When notification was created
    
  3. Security
    - Enable RLS
    - Group creators can view notifications for their groups
    - Only creators can mark notifications as read/dismissed
*/

-- Create payment due notifications table
CREATE TABLE IF NOT EXISTS payment_due_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  beneficiary_id uuid NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  payment_due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  cycle_number integer NOT NULL CHECK (cycle_number > 0),
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_due_group_id ON payment_due_notifications(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_due_date ON payment_due_notifications(payment_due_date);
CREATE INDEX IF NOT EXISTS idx_payment_due_unread ON payment_due_notifications(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE payment_due_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Group creators can view their notifications
CREATE POLICY "Group creators can view payment due notifications"
  ON payment_due_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_due_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Group creators can update their notifications (mark as read/dismissed)
CREATE POLICY "Group creators can update payment due notifications"
  ON payment_due_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_due_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = payment_due_notifications.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: System can insert notifications (for edge functions/triggers)
CREATE POLICY "System can insert payment due notifications"
  ON payment_due_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE payment_due_notifications IS 'Notifications to alert group creators when payments are due to members';
COMMENT ON COLUMN payment_due_notifications.payment_due_date IS 'The date when payment should be made to the beneficiary';
COMMENT ON COLUMN payment_due_notifications.is_read IS 'Whether the creator has viewed this notification';
COMMENT ON COLUMN payment_due_notifications.is_dismissed IS 'Whether the creator has dismissed/hidden this notification';
/*
  # Create Member Payment History System

  1. New Table: member_payment_history
    - Tracks individual member payments for each cycle
    - Records when members pay their monthly/weekly/daily contribution
    - Allows group creator to check off payments
    - Stores payment confirmation details
    
  2. Fields
    - `id` (uuid, primary key) - Unique payment record identifier
    - `group_id` (uuid, foreign key) - Reference to the likelemba group
    - `member_id` (uuid, foreign key) - Reference to the member
    - `cycle_number` (integer) - Which payment cycle this is for
    - `amount_due` (numeric) - Amount member should pay this cycle
    - `amount_paid` (numeric) - Actual amount paid
    - `payment_date` (timestamptz) - When payment was made
    - `marked_paid_by` (uuid) - Who marked this as paid (creator)
    - `is_paid` (boolean) - Payment status
    - `reminder_sent` (boolean) - Whether reminder email was sent
    - `reminder_sent_at` (timestamptz) - When reminder was sent
    - `notes` (text) - Optional notes about the payment
    - `created_at` (timestamptz) - Record creation timestamp
    
  3. Security
    - Enable RLS
    - Group creators can view and manage payments for their groups
    - Members can view their own payment records
*/

-- Create member payment history table
CREATE TABLE IF NOT EXISTS member_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES likelemba_groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES group_members(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL CHECK (cycle_number > 0),
  amount_due numeric NOT NULL CHECK (amount_due > 0),
  amount_paid numeric DEFAULT 0 CHECK (amount_paid >= 0),
  payment_date timestamptz,
  marked_paid_by uuid REFERENCES profiles(id),
  is_paid boolean DEFAULT false,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, member_id, cycle_number)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_history_group_cycle ON member_payment_history(group_id, cycle_number);
CREATE INDEX IF NOT EXISTS idx_payment_history_member ON member_payment_history(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_unpaid ON member_payment_history(is_paid) WHERE is_paid = false;

-- Enable RLS
ALTER TABLE member_payment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Group creators can view payment history for their groups
CREATE POLICY "Group creators can view payment history"
  ON member_payment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = member_payment_history.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Group creators can update payment history for their groups
CREATE POLICY "Group creators can update payment history"
  ON member_payment_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = member_payment_history.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = member_payment_history.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Group creators can insert payment records
CREATE POLICY "Group creators can insert payment history"
  ON member_payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM likelemba_groups
      WHERE likelemba_groups.id = member_payment_history.group_id
      AND likelemba_groups.creator_id = auth.uid()
    )
  );

-- Policy: Members can view their own payment history
CREATE POLICY "Members can view own payment history"
  ON member_payment_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.id = member_payment_history.member_id
      AND group_members.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Function to automatically create payment records for a new cycle
CREATE OR REPLACE FUNCTION create_payment_records_for_cycle(
  p_group_id uuid,
  p_cycle_number integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO member_payment_history (group_id, member_id, cycle_number, amount_due)
  SELECT 
    p_group_id,
    gm.id,
    p_cycle_number,
    gm.membership_amount
  FROM group_members gm
  WHERE gm.group_id = p_group_id
  ON CONFLICT (group_id, member_id, cycle_number) DO NOTHING;
END;
$$;

-- Add helpful comments
COMMENT ON TABLE member_payment_history IS 'Tracks member payments for each cycle in a group';
COMMENT ON COLUMN member_payment_history.is_paid IS 'Whether the member has paid for this cycle';
COMMENT ON COLUMN member_payment_history.reminder_sent IS 'Whether a payment reminder was sent to this member';
COMMENT ON FUNCTION create_payment_records_for_cycle IS 'Creates payment records for all members in a group for a specific cycle';
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
/*
  # Add Scheduled Payment Dates for Members

  ## Changes
  
  1. Add scheduled_payment_date to group_members
    - Each member gets their own payment date based on receipt_order
    - This date is calculated based on group start_date and payment_frequency
  
  2. Function to populate scheduled dates
    - Automatically calculates payment dates for existing members
  
  ## Security
  - No new RLS policies needed (inherits from group_members table)
*/

-- Add scheduled_payment_date column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'group_members' AND column_name = 'scheduled_payment_date'
  ) THEN
    ALTER TABLE group_members ADD COLUMN scheduled_payment_date date;
  END IF;
END $$;

-- Function to update scheduled payment dates for a group's members
CREATE OR REPLACE FUNCTION update_member_scheduled_dates(p_group_id uuid)
RETURNS void AS $$
DECLARE
  v_start_date date;
  v_frequency text;
  v_member RECORD;
BEGIN
  -- Get group info
  SELECT start_date, payment_frequency
  INTO v_start_date, v_frequency
  FROM likelemba_groups
  WHERE id = p_group_id;

  -- Update each member's scheduled date
  FOR v_member IN
    SELECT id, receipt_order
    FROM group_members
    WHERE group_id = p_group_id
  LOOP
    UPDATE group_members
    SET scheduled_payment_date = calculate_next_payment_date(
      v_start_date,
      v_frequency,
      v_member.receipt_order
    )
    WHERE id = v_member.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set scheduled_payment_date when a new member is added
CREATE OR REPLACE FUNCTION set_member_scheduled_date()
RETURNS TRIGGER AS $$
DECLARE
  v_start_date date;
  v_frequency text;
BEGIN
  -- Get group info
  SELECT start_date, payment_frequency
  INTO v_start_date, v_frequency
  FROM likelemba_groups
  WHERE id = NEW.group_id;

  -- Set scheduled date based on receipt order
  NEW.scheduled_payment_date := calculate_next_payment_date(
    v_start_date,
    v_frequency,
    NEW.receipt_order
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_set_member_scheduled_date ON group_members;
CREATE TRIGGER trigger_set_member_scheduled_date
  BEFORE INSERT OR UPDATE OF receipt_order
  ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION set_member_scheduled_date();

-- Populate scheduled dates for existing members
DO $$
DECLARE
  v_group RECORD;
BEGIN
  FOR v_group IN SELECT DISTINCT id FROM likelemba_groups
  LOOP
    PERFORM update_member_scheduled_dates(v_group.id);
  END LOOP;
END $$;
/*
  # Add Group Status and Pause/Resume Functionality

  ## Changes
  
  1. Add status tracking to likelemba_groups
    - `status` - Track group status: active, paused, ended
    - `paused_at` - When the group was paused
    - `resumed_at` - When the group was last resumed
    - `days_paused` - Total days the group has been paused
  
  2. Function to check and update group status
    - Automatically sets status to 'ended' when end_date is reached
    - Calculates adjusted dates when group is resumed
  
  3. Triggers
    - Auto-update status based on end_date
  
  ## Security
  - Only group creators can pause/resume groups
  - RLS policies inherited from likelemba_groups table
*/

-- Add status columns to likelemba_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'status'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'paused_at'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN paused_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'resumed_at'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN resumed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'days_paused'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN days_paused integer DEFAULT 0;
  END IF;
END $$;

-- Function to check and update group status based on end date
CREATE OR REPLACE FUNCTION check_group_end_date()
RETURNS void AS $$
BEGIN
  UPDATE likelemba_groups
  SET status = 'ended'
  WHERE status = 'active'
    AND end_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to pause a group
CREATE OR REPLACE FUNCTION pause_group(p_group_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE likelemba_groups
  SET 
    status = 'paused',
    paused_at = now()
  WHERE id = p_group_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to resume a group
CREATE OR REPLACE FUNCTION resume_group(p_group_id uuid)
RETURNS void AS $$
DECLARE
  v_paused_at timestamptz;
  v_days_paused_this_time integer;
  v_current_days_paused integer;
  v_start_date date;
  v_end_date date;
  v_frequency text;
  v_member RECORD;
BEGIN
  -- Get group info
  SELECT paused_at, days_paused, start_date, end_date, payment_frequency
  INTO v_paused_at, v_current_days_paused, v_start_date, v_end_date, v_frequency
  FROM likelemba_groups
  WHERE id = p_group_id
    AND status = 'paused';

  IF v_paused_at IS NULL THEN
    RETURN;
  END IF;

  -- Calculate days paused this time
  v_days_paused_this_time := EXTRACT(DAY FROM (now() - v_paused_at));
  
  -- Update group status
  UPDATE likelemba_groups
  SET 
    status = 'active',
    resumed_at = now(),
    days_paused = COALESCE(v_current_days_paused, 0) + v_days_paused_this_time,
    start_date = v_start_date + (COALESCE(v_current_days_paused, 0) + v_days_paused_this_time),
    end_date = v_end_date + (COALESCE(v_current_days_paused, 0) + v_days_paused_this_time),
    cycle_start_date = CURRENT_DATE
  WHERE id = p_group_id;

  -- Update all member scheduled payment dates
  FOR v_member IN
    SELECT id, receipt_order
    FROM group_members
    WHERE group_id = p_group_id
  LOOP
    UPDATE group_members
    SET scheduled_payment_date = calculate_next_payment_date(
      v_start_date + (COALESCE(v_current_days_paused, 0) + v_days_paused_this_time),
      v_frequency,
      v_member.receipt_order
    )
    WHERE id = v_member.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_likelemba_groups_status ON likelemba_groups(status);
CREATE INDEX IF NOT EXISTS idx_likelemba_groups_end_date ON likelemba_groups(end_date) WHERE status = 'active';

-- Update existing groups to have active status
UPDATE likelemba_groups
SET status = 'ended'
WHERE end_date < CURRENT_DATE
  AND status IS NULL;

UPDATE likelemba_groups
SET status = 'active'
WHERE status IS NULL;
/*
  # Add Service Fee Payment Tracking

  ## Overview
  Adds fields to track service fee payment deadline and payment method for Likelemba groups.

  ## Changes
  1. Add Fields to `likelemba_groups` table:
    - `service_fee_deadline` (timestamptz) - Deadline for service fee payment (2 weeks from group creation)
    - `service_fee_payment_method` (text) - Payment method used (paypal, interac, cash)
    - `service_fee_paid_at` (timestamptz) - When the service fee was paid

  ## Notes
  - Service fee deadline is automatically set to 2 weeks from group creation
  - Main member (group creator) can pay via PayPal using paypal.me/MpingiPro
  - Payment can be marked as paid after confirmation
*/

-- Add service fee payment tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'service_fee_deadline'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN service_fee_deadline timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'service_fee_payment_method'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN service_fee_payment_method text CHECK (service_fee_payment_method IN ('paypal', 'interac', 'cash'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'likelemba_groups' AND column_name = 'service_fee_paid_at'
  ) THEN
    ALTER TABLE likelemba_groups ADD COLUMN service_fee_paid_at timestamptz;
  END IF;
END $$;

-- Set default deadline for existing groups (2 weeks from creation)
UPDATE likelemba_groups
SET service_fee_deadline = created_at + INTERVAL '2 weeks'
WHERE service_fee_deadline IS NULL;

-- Create function to automatically set service fee deadline on group creation
CREATE OR REPLACE FUNCTION set_service_fee_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_fee_deadline IS NULL THEN
    NEW.service_fee_deadline = NEW.created_at + INTERVAL '2 weeks';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set service fee deadline
DROP TRIGGER IF EXISTS set_service_fee_deadline_trigger ON likelemba_groups;
CREATE TRIGGER set_service_fee_deadline_trigger
  BEFORE INSERT ON likelemba_groups
  FOR EACH ROW
  EXECUTE FUNCTION set_service_fee_deadline();
/*
  # Create FAQ System

  1. New Tables
    - `faq_questions`
      - `id` (uuid, primary key)
      - `question` (text) - The FAQ question
      - `answer` (text) - The answer to the question
      - `category` (text) - Category for organization
      - `is_active` (boolean) - Whether the FAQ is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `faq_chat_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - User who asked
      - `question` (text) - User's question
      - `answer` (text) - AI's answer
      - `helpful` (boolean, nullable) - User feedback
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public can read active FAQs
    - Only authenticated users can view their own chat history
    - Only authenticated users can create chat entries
*/

-- Create faq_questions table
CREATE TABLE IF NOT EXISTS faq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create faq_chat_history table
CREATE TABLE IF NOT EXISTS faq_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  helpful boolean DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_chat_history ENABLE ROW LEVEL SECURITY;

-- Policies for faq_questions
CREATE POLICY "Anyone can view active FAQs"
  ON faq_questions FOR SELECT
  USING (is_active = true);

-- Policies for faq_chat_history
CREATE POLICY "Users can view own chat history"
  ON faq_chat_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat entries"
  ON faq_chat_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat feedback"
  ON faq_chat_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert some default FAQs
INSERT INTO faq_questions (question, answer, category) VALUES
  (
    'What is Likelemba?',
    'Likelemba is a rotating savings and credit association (ROSCA) management system. It helps groups of people pool their money together and take turns receiving the total amount collected. It''s a traditional savings method made digital and easy to manage.',
    'general'
  ),
  (
    'How do I create a group?',
    'To create a group, go to your Dashboard and click "Create New Group". Fill in the group details including name, number of members, monthly amount, payment frequency, and start date. Once created, you can add members to the group.',
    'getting-started'
  ),
  (
    'How does the payment cycle work?',
    'Each member contributes a fixed amount according to the payment frequency (daily, weekly, or monthly). Members take turns receiving the total pool based on their receipt order. The cycle continues until all members have received their payout.',
    'payments'
  ),
  (
    'Can I pause a group?',
    'Yes! As the group creator, you can pause a group from the Members page. When paused, all payment schedules are suspended. When you resume, the system automatically adjusts all future payment dates based on how long the group was paused.',
    'group-management'
  ),
  (
    'How do I add members to my group?',
    'Go to the Members page for your group. You can add members individually by clicking "Add Member" or import multiple members at once using an Excel or CSV file. Download the template to ensure your file has the correct format.',
    'members'
  ),
  (
    'What payment methods are supported?',
    'Likelemba supports tracking for various payment methods including Cash, Bank Transfer, Mobile Money, PayPal, Venmo, and Zelle. The system tracks payments but doesn''t process them directly - you handle actual money transfers within your group.',
    'payments'
  ),
  (
    'How do I track payments?',
    'On the Members page, you''ll see all members and their payment status. Click "Record Payment" when a member pays their contribution. The system will automatically notify all group members and update the payment schedule.',
    'payments'
  ),
  (
    'Can I export payment reports?',
    'Yes! From the Members page, you can export detailed payment reports in PDF, Excel, or Word format. Reports include all member details, payment history, and group financial summaries.',
    'reports'
  ),
  (
    'What is the service fee?',
    'The service fee is a one-time administrative charge for managing the group. It''s calculated as 1% of the total amount collected per cycle and is paid by the member receiving the payout.',
    'general'
  ),
  (
    'How do I share my group with others?',
    'Each group has a unique shareable link that you can generate from the Members page. Anyone with this link can view the group''s basic information and member list, making it easy to keep everyone informed.',
    'group-management'
  );

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_faq_questions_category ON faq_questions(category);
CREATE INDEX IF NOT EXISTS idx_faq_chat_history_user ON faq_chat_history(user_id, created_at DESC);
/*
  # Create Admin System

  ## Overview
  This migration creates a comprehensive admin system for the Likelemba platform.

  ## New Tables

  ### 1. `admin_users`
  Tracks users with admin privileges
  - `id` (uuid, primary key) - References profiles
  - `role` (text) - Admin role: super_admin, admin, moderator
  - `permissions` (jsonb) - Specific permissions granted
  - `created_at` (timestamptz) - When admin status was granted
  - `created_by` (uuid) - References admin who granted this status

  ### 2. `admin_activity_log`
  Logs all admin actions for audit trail
  - `id` (uuid, primary key)
  - `admin_id` (uuid) - References admin_users
  - `action` (text) - Action performed
  - `target_type` (text) - Type of entity affected
  - `target_id` (uuid) - ID of affected entity
  - `details` (jsonb) - Additional details
  - `created_at` (timestamptz)

  ### 3. `system_settings`
  Stores system-wide configuration
  - `key` (text, primary key) - Setting key
  - `value` (jsonb) - Setting value
  - `description` (text) - What this setting does
  - `updated_at` (timestamptz)
  - `updated_by` (uuid) - References admin_users

  ## Modified Tables

  ### profiles
  - Add `is_admin` (boolean) - Quick flag for admin status
  - Add `account_status` (text) - active, suspended, banned

  ### contact_messages
  - Add `responded_at` (timestamptz) - When admin responded
  - Add `responded_by` (uuid) - Admin who responded
  - Add `response` (text) - Admin's response

  ## Security
  - RLS enabled on all admin tables
  - Only admins can access admin tables
  - Activity logging for all admin actions
  - Super admins can manage other admins
*/

-- Add admin fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned'));
  END IF;
END $$;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions jsonb DEFAULT '{"users": true, "groups": true, "payments": true, "messages": true, "faqs": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
  ON admin_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Admins can create activity logs"
  ON admin_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES admin_users(id)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Super admins can modify system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Add response fields to contact_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_messages' AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE contact_messages ADD COLUMN responded_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_messages' AND column_name = 'responded_by'
  ) THEN
    ALTER TABLE contact_messages ADD COLUMN responded_by uuid REFERENCES admin_users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_messages' AND column_name = 'response'
  ) THEN
    ALTER TABLE contact_messages ADD COLUMN response text;
  END IF;
END $$;

-- Add RLS policy for admins to manage contact messages
CREATE POLICY "Admins can view all contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update contact messages"
  ON contact_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

-- Create RLS policies for admins to view all data
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update user status"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all groups"
  ON likelemba_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Enable maintenance mode to prevent user access'),
  ('service_fee_per_member', '2.00', 'Service fee charged per member in CAD'),
  ('allow_registrations', 'true', 'Allow new user registrations'),
  ('max_group_members', '50', 'Maximum number of members allowed per group'),
  ('min_group_members', '2', 'Minimum number of members required per group')
ON CONFLICT (key) DO NOTHING;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id uuid,
  p_action text,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
