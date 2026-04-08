-- ============================================================
-- Migration: Add position support, report templates, and admin features
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add position column to intern_users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intern_users' AND column_name = 'position'
  ) THEN
    ALTER TABLE intern_users ADD COLUMN position text DEFAULT 'intern';
  END IF;
END $$;

-- 2. Add phone column to intern_users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intern_users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE intern_users ADD COLUMN phone text;
  END IF;
END $$;

-- 3. Add start_date column to intern_users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intern_users' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE intern_users ADD COLUMN start_date date;
  END IF;
END $$;

-- 4. Add status column to intern_users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intern_users' AND column_name = 'status'
  ) THEN
    ALTER TABLE intern_users ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

-- 5. Create report_templates table for customizable templates
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('daily', 'weekly', 'checklist')),
  position text,
  fields jsonb NOT NULL DEFAULT '[]',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Enable RLS on report_templates
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates
CREATE POLICY IF NOT EXISTS "Templates are viewable by authenticated users"
  ON report_templates FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage templates (insert, update, delete)
-- This checks the intern_users table for admin role
CREATE POLICY IF NOT EXISTS "Admins can manage templates"
  ON report_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.auth_id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 7. Create team_positions table for custom position definitions
CREATE TABLE IF NOT EXISTS team_positions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  color text DEFAULT '#6366f1',
  icon text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on team_positions
ALTER TABLE team_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Positions are viewable by authenticated users"
  ON team_positions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage positions"
  ON team_positions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.auth_id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 8. Insert default positions
INSERT INTO team_positions (name, display_name, color) VALUES
  ('intern', 'Intern', '#6366f1'),
  ('marketer', 'Marketer', '#ec4899'),
  ('developer', 'Developer', '#10b981'),
  ('designer', 'Designer', '#8b5cf6'),
  ('manager', 'Manager', '#f59e0b'),
  ('sales', 'Sales', '#06b6d4'),
  ('operations', 'Operations', '#f97316'),
  ('content', 'Content Creator', '#f43f5e'),
  ('analyst', 'Analyst', '#14b8a6')
ON CONFLICT (name) DO NOTHING;

-- 9. Ensure all existing users have a position set
UPDATE intern_users SET position = 'intern' WHERE position IS NULL;
