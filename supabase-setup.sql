-- ============================================
-- FUCS Exam Prep - Supabase Setup
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor)
-- ============================================

-- 1. Table: fucs_users (access codes + device lock)
CREATE TABLE IF NOT EXISTS fucs_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code TEXT UNIQUE NOT NULL,
  student_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  device_fingerprint TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ DEFAULT NULL,
  notes TEXT DEFAULT ''
);

-- 2. Enable Row Level Security
ALTER TABLE fucs_users ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow anyone to read their own row (by access_code)
CREATE POLICY "Users can read by access_code"
  ON fucs_users FOR SELECT
  USING (true);

-- 4. Policy: Allow updates (for saving fingerprint + last_login)
CREATE POLICY "Users can update their own row"
  ON fucs_users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Insert some initial access codes
-- CHANGE THESE to your own codes!
INSERT INTO fucs_users (access_code, notes) VALUES
  ('FUCS-ADMIN01', 'Admin - Daniel'),
  ('FUCS-EST001', 'Estudiante 1'),
  ('FUCS-EST002', 'Estudiante 2'),
  ('FUCS-EST003', 'Estudiante 3'),
  ('FUCS-EST004', 'Estudiante 4'),
  ('FUCS-EST005', 'Estudiante 5'),
  ('FUCS-EST006', 'Estudiante 6'),
  ('FUCS-EST007', 'Estudiante 7'),
  ('FUCS-EST008', 'Estudiante 8'),
  ('FUCS-EST009', 'Estudiante 9'),
  ('FUCS-EST010', 'Estudiante 10')
ON CONFLICT (access_code) DO NOTHING;

-- ============================================
-- USEFUL QUERIES FOR ADMIN:
-- ============================================

-- See all users and their status:
-- SELECT access_code, student_name, is_active, device_fingerprint IS NOT NULL as has_device, last_login FROM fucs_users ORDER BY created_at;

-- Add a new user:
-- INSERT INTO fucs_users (access_code, notes) VALUES ('FUCS-NEW01', 'Nuevo estudiante');

-- Unlock a device (reset fingerprint so they can login from another device):
-- UPDATE fucs_users SET device_fingerprint = NULL WHERE access_code = 'FUCS-EST001';

-- Deactivate a user:
-- UPDATE fucs_users SET is_active = false WHERE access_code = 'FUCS-EST001';

-- Generate 20 random codes:
-- INSERT INTO fucs_users (access_code, notes)
-- SELECT 'FUCS-' || upper(substr(md5(random()::text), 1, 6)), 'Auto-generated'
-- FROM generate_series(1, 20);
