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
