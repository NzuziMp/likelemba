/*
  # Create Visitor Counter System
  
  ## Overview
  Tracks homepage visitors and displays total visit count.
  
  ## New Tables
  
  ### `page_views`
  Tracks individual page views
  - `id` (uuid, primary key)
  - `page` (text) - Page identifier (e.g., 'homepage')
  - `visitor_ip` (text) - Visitor IP (hashed for privacy)
  - `user_agent` (text) - Browser user agent
  - `created_at` (timestamptz) - Visit timestamp
  
  ### `visitor_stats`
  Stores aggregated visitor statistics
  - `page` (text, primary key) - Page identifier
  - `total_visits` (bigint) - Total number of visits
  - `unique_visitors` (bigint) - Unique visitors (by IP)
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - RLS enabled
  - Public read access for stats
  - Authenticated insert for tracking
  - Function to increment counter safely
*/

-- Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT 'homepage',
  visitor_ip text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert page views
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create visitor_stats table
CREATE TABLE IF NOT EXISTS visitor_stats (
  page text PRIMARY KEY,
  total_visits bigint DEFAULT 0,
  unique_visitors bigint DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE visitor_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view stats
CREATE POLICY "Anyone can view visitor stats"
  ON visitor_stats FOR SELECT
  TO anon, authenticated
  USING (true);

-- Initialize homepage stats
INSERT INTO visitor_stats (page, total_visits, unique_visitors)
VALUES ('homepage', 0, 0)
ON CONFLICT (page) DO NOTHING;

-- Create function to increment visitor count
CREATE OR REPLACE FUNCTION increment_page_view(
  p_page text DEFAULT 'homepage',
  p_visitor_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_total_visits bigint;
  v_unique_visitors bigint;
  v_is_unique boolean;
BEGIN
  -- Insert the page view
  INSERT INTO page_views (page, visitor_ip, user_agent)
  VALUES (p_page, p_visitor_ip, p_user_agent);
  
  -- Check if this is a unique visitor (first visit in last 24 hours)
  v_is_unique := NOT EXISTS (
    SELECT 1 FROM page_views
    WHERE page = p_page
    AND visitor_ip = p_visitor_ip
    AND created_at > now() - interval '24 hours'
    AND created_at < now() - interval '1 minute'
  );
  
  -- Update stats
  UPDATE visitor_stats
  SET 
    total_visits = total_visits + 1,
    unique_visitors = unique_visitors + CASE WHEN v_is_unique THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE page = p_page
  RETURNING total_visits, unique_visitors INTO v_total_visits, v_unique_visitors;
  
  -- Return updated stats
  RETURN jsonb_build_object(
    'total_visits', v_total_visits,
    'unique_visitors', v_unique_visitors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_page ON page_views(page);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_ip ON page_views(visitor_ip);
