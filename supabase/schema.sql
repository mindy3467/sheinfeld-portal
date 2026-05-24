-- ============================================================
-- Sheinfeld Tenant Portal - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('pinuy_binuy', 'tama38')),
  current_stage text,
  signature_count integer NOT NULL DEFAULT 0,
  total_units   integer NOT NULL DEFAULT 0,
  handover_date date,
  handover_note text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- APARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS apartments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  address             text NOT NULL,
  floor               integer,
  current_area        numeric(6,2),
  new_area            numeric(6,2),
  new_floor           integer,
  appreciation_percent numeric(5,2),
  appreciation_ils    numeric(12,2),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- USERS (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text UNIQUE NOT NULL,
  full_name    text NOT NULL,
  phone        text,
  role         text NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'admin')),
  project_id   uuid REFERENCES projects(id) ON DELETE SET NULL,
  apartment_id uuid REFERENCES apartments(id) ON DELETE SET NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TIMELINE STEPS
-- ============================================================
CREATE TABLE IF NOT EXISTS timeline_steps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      text NOT NULL,
  date       date,
  status     text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('completed', 'active', 'upcoming')),
  note       text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PROJECT TEAM
-- ============================================================
CREATE TABLE IF NOT EXISTS project_team (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  role       text NOT NULL,
  company    text,
  photo_url  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- AMENITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS amenities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         text NOT NULL,
  has_amenity  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- APARTMENT SPECS (tabbed spec content)
-- ============================================================
CREATE TABLE IF NOT EXISTS apartment_specs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category   text NOT NULL CHECK (category IN ('finishes','kitchen','electrical','plumbing','exterior')),
  title      text NOT NULL,
  description text,
  image_url  text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category    text NOT NULL CHECK (category IN ('contracts','guarantees','deposits','power_of_attorney','approvals','blueprints')),
  name        text NOT NULL,
  file_url    text NOT NULL,
  file_size   integer,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CHAT MESSAGES (Phase 2 - scaffold only)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    text NOT NULL,
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team   ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Helper function: get current user project_id
CREATE OR REPLACE FUNCTION current_user_project_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
  SELECT project_id FROM users WHERE id = auth.uid();
$$;

-- PROJECTS: admins see all, tenants see their own project
CREATE POLICY "projects_tenant_read" ON projects FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR id = current_user_project_id()
  );
CREATE POLICY "projects_admin_all" ON projects FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- APARTMENTS: admins see all, tenants see their own apartment
CREATE POLICY "apartments_tenant_read" ON apartments FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR id = (SELECT apartment_id FROM users WHERE id = auth.uid())
  );
CREATE POLICY "apartments_admin_all" ON apartments FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- USERS: each user sees their own row; admins see all
CREATE POLICY "users_self_read" ON users FOR SELECT
  USING (id = auth.uid() OR current_user_role() = 'admin');
CREATE POLICY "users_admin_all" ON users FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- TIMELINE STEPS: tenants see their project; admins all
CREATE POLICY "timeline_tenant_read" ON timeline_steps FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR project_id = current_user_project_id()
  );
CREATE POLICY "timeline_admin_all" ON timeline_steps FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- PROJECT TEAM: same as timeline
CREATE POLICY "team_tenant_read" ON project_team FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR project_id = current_user_project_id()
  );
CREATE POLICY "team_admin_all" ON project_team FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- AMENITIES: same
CREATE POLICY "amenities_tenant_read" ON amenities FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR project_id = current_user_project_id()
  );
CREATE POLICY "amenities_admin_all" ON amenities FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- APARTMENT SPECS: same
CREATE POLICY "specs_tenant_read" ON apartment_specs FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR project_id = current_user_project_id()
  );
CREATE POLICY "specs_admin_all" ON apartment_specs FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- DOCUMENTS: tenants see only their own documents; admins all
CREATE POLICY "docs_tenant_read" ON documents FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR tenant_id = auth.uid()
  );
CREATE POLICY "docs_admin_all" ON documents FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- CHAT MESSAGES: tenants see messages in their project; admins all
CREATE POLICY "chat_tenant_read" ON chat_messages FOR SELECT
  USING (
    current_user_role() = 'admin'
    OR project_id = current_user_project_id()
  );
CREATE POLICY "chat_admin_all" ON chat_messages FOR ALL
  USING (current_user_role() = 'admin')
  WITH CHECK (current_user_role() = 'admin');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run separately in Supabase Dashboard > Storage > New Bucket:
-- 1. documents   (private, max 50MB)
-- 2. team-photos (public,  max 5MB)
-- 3. spec-images (public,  max 10MB)

-- ============================================================
-- SEED DATA (demo project)
-- ============================================================
INSERT INTO projects (id, name, type, current_stage, signature_count, total_units, handover_date, handover_note)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'פרויקט שיינפלד - רמת גן',
  'pinuy_binuy',
  'הגשת בקשה להיתר בניה',
  38,
  50,
  '2027-12-01',
  'עודכן בשל מצב הביטחוני'
) ON CONFLICT DO NOTHING;

INSERT INTO timeline_steps (project_id, title, date, status, note, sort_order)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'גיבוש חתימות', '2024-03-01', 'completed', null, 1),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'מינוי בעלי מקצוע', '2024-06-01', 'completed', null, 2),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'הגשת בקשה להיתר בניה', '2025-01-01', 'active', 'הגשה הושלמה, ממתינים לאישור', 3),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'אישור היתר', '2025-08-01', 'upcoming', null, 4),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'התחלת בניה', '2026-01-01', 'upcoming', null, 5),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'מסירת מפתח', '2027-12-01', 'upcoming', null, 6)
ON CONFLICT DO NOTHING;

INSERT INTO amenities (project_id, name, has_amenity)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'מעלית', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'חניה', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'מחסן', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'ממ"ד', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'גינה', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'חדר כושר', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'בריכה', false),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'חדר אופניים', true)
ON CONFLICT DO NOTHING;

INSERT INTO project_team (project_id, full_name, role, company)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'שיינפלד קבוצה', 'יזם', 'שיינפלד גרופ בע"מ'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'ישראל ישראלי', 'אדריכל', 'משרד ישראלי אדריכלים'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'דוד לוי', 'קבלן מבצע', 'לוי בנייה בע"מ'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'שרה כהן עו"ד', 'עו"ד דיירים', 'כהן ושות'' עורכי דין'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'מיכאל גולן', 'מנהל אתר', 'לוי בנייה בע"מ')
ON CONFLICT DO NOTHING;
