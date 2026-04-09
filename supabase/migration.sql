-- ============================================================
-- Checkmark Audio -- Internal Operating System
-- Migration: Full schema for team ops, projects, sessions,
-- pipeline, education, metrics, and deliverable tracking
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Add columns to intern_users if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intern_users' AND column_name = 'position'
  ) THEN
    ALTER TABLE intern_users ADD COLUMN position text DEFAULT 'intern';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intern_users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE intern_users ADD COLUMN phone text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intern_users' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE intern_users ADD COLUMN start_date date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'intern_users' AND column_name = 'status'
  ) THEN
    ALTER TABLE intern_users ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

-- 2. Report templates
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

ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Templates are viewable by authenticated users"
  ON report_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage templates"
  ON report_templates FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 3. Team positions
CREATE TABLE IF NOT EXISTS team_positions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  color text DEFAULT '#C9A84C',
  icon text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Positions are viewable by authenticated users"
  ON team_positions FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage positions"
  ON team_positions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

INSERT INTO team_positions (name, display_name, color) VALUES
  ('owner', 'Owner / Lead Engineer', '#C9A84C'),
  ('marketing_admin', 'Marketing / Admin', '#10b981'),
  ('artist_development', 'Artist Development', '#8b5cf6'),
  ('intern', 'Intern', '#6366f1'),
  ('engineer', 'Audio Engineer', '#f59e0b'),
  ('producer', 'Producer', '#f43f5e')
ON CONFLICT (name) DO UPDATE SET display_name = EXCLUDED.display_name, color = EXCLUDED.color;

-- 4. Task assignments (links templates to users or positions)
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  intern_id uuid REFERENCES intern_users(id) ON DELETE CASCADE,
  position text,
  is_active boolean DEFAULT true,
  assigned_by uuid REFERENCES intern_users(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT assignment_target CHECK (intern_id IS NOT NULL OR position IS NOT NULL)
);

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Assignments viewable by authenticated users"
  ON task_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage assignments"
  ON task_assignments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 5. Platform metrics (follower counts for IG, TikTok, YouTube)
CREATE TABLE IF NOT EXISTS platform_metrics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  metric_date date NOT NULL,
  follower_count integer NOT NULL,
  entered_by uuid REFERENCES intern_users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(platform, metric_date)
);

ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Metrics viewable by authenticated users"
  ON platform_metrics FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert metrics"
  ON platform_metrics FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Deliverable submissions (proof of must-do completion)
CREATE TABLE IF NOT EXISTS deliverable_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  intern_id uuid NOT NULL REFERENCES intern_users(id) ON DELETE CASCADE,
  submission_date date NOT NULL,
  submission_type text NOT NULL,
  dropbox_url text,
  platform_tag text,
  notes text,
  reviewed_by uuid REFERENCES intern_users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deliverable_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Submissions viewable by authenticated users"
  ON deliverable_submissions FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own submissions"
  ON deliverable_submissions FOR INSERT TO authenticated
  WITH CHECK (intern_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can update submissions"
  ON deliverable_submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 7. Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  client_name text,
  project_type text NOT NULL CHECK (project_type IN ('recording', 'mixing', 'mastering', 'artist_dev', 'education', 'internal')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  assigned_to uuid REFERENCES intern_users(id),
  notes text,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Projects viewable by authenticated users"
  ON projects FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage projects"
  ON projects FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 8. Sessions (studio bookings)
CREATE TABLE IF NOT EXISTS sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_name text,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('recording', 'mixing', 'lesson', 'meeting')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  room text,
  notes text,
  created_by uuid REFERENCES intern_users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Sessions viewable by authenticated users"
  ON sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage sessions"
  ON sessions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 9. Artist pipeline
CREATE TABLE IF NOT EXISTS artist_pipeline (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_name text NOT NULL,
  contact_email text,
  contact_phone text,
  stage text NOT NULL DEFAULT 'inquiry' CHECK (stage IN ('inquiry', 'onboarding', 'active', 'release_support', 'alumni')),
  assigned_to uuid REFERENCES intern_users(id),
  notes text,
  next_followup date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE artist_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Pipeline viewable by authenticated users"
  ON artist_pipeline FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage pipeline"
  ON artist_pipeline FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 10. Education students
CREATE TABLE IF NOT EXISTS education_students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name text NOT NULL,
  contact_email text,
  instrument text,
  level text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  assigned_to uuid REFERENCES intern_users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE education_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Students viewable by authenticated users"
  ON education_students FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Admins can manage students"
  ON education_students FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM intern_users
      WHERE intern_users.id = auth.uid()
      AND intern_users.role = 'admin'
    )
  );

-- 11. Ensure all existing users have a position set
UPDATE intern_users SET position = 'intern' WHERE position IS NULL;
