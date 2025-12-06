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
