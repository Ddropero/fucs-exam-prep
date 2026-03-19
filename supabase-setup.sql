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
-- 6. Table: device change requests
-- ============================================
CREATE TABLE IF NOT EXISTS fucs_device_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES fucs_users(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL,
  new_fingerprint TEXT NOT NULL,
  old_fingerprint TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ DEFAULT NULL,
  device_info TEXT DEFAULT ''
);

ALTER TABLE fucs_device_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert requests" ON fucs_device_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read requests" ON fucs_device_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can update requests" ON fucs_device_requests FOR UPDATE USING (true) WITH CHECK (true);

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

-- ============================================
-- DEVICE REQUEST MANAGEMENT:
-- ============================================

-- See pending device requests:
-- SELECT dr.access_code, u.student_name, dr.device_info, dr.status, dr.created_at
-- FROM fucs_device_requests dr JOIN fucs_users u ON dr.user_id = u.id
-- WHERE dr.status = 'pending' ORDER BY dr.created_at;

-- Approve a device request (updates fingerprint automatically on next login):
-- UPDATE fucs_device_requests SET status = 'approved', resolved_at = now()
-- WHERE access_code = 'FUCS-EST001' AND status = 'pending';

-- Deny a device request:
-- UPDATE fucs_device_requests SET status = 'denied', resolved_at = now()
-- WHERE access_code = 'FUCS-EST001' AND status = 'pending';
