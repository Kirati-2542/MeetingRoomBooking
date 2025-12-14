-- ============================================
-- Simple RLS Fix for Custom Authentication
-- ============================================
-- This app uses CUSTOM authentication (not Supabase Auth)
-- Therefore, we need permissive policies for anon key access

-- 1. Disable RLS completely (simplest fix for development)
-- Uncomment one of the options below:

-- OPTION A: Disable RLS entirely (for development/testing)
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- OPTION B: Keep RLS enabled but allow all operations
-- (Comment out OPTION A and uncomment below if you want RLS on but permissive)
/*
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read bookings" ON bookings;
DROP POLICY IF EXISTS "Allow individual read own bookings" ON bookings;
DROP POLICY IF EXISTS "Allow insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow update bookings" ON bookings;
DROP POLICY IF EXISTS "Allow delete bookings" ON bookings;
DROP POLICY IF EXISTS "Allow delete own bookings" ON bookings;

CREATE POLICY "Allow all select bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Allow all insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Allow all delete bookings" ON bookings FOR DELETE USING (true);
*/
