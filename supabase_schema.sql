-- ============================================
-- EduMeet Room Booking - Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'APPROVER', 'ADMIN')),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Rooms Table
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  equipment TEXT,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Bookings Table
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  purpose TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  approver_id UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_datetime ON bookings(start_datetime, end_datetime);

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample users
INSERT INTO users (username, password_hash, full_name, role, status, email) VALUES
  ('admin', 'admin123', 'ผู้ดูแลระบบ', 'ADMIN', 'ACTIVE', 'admin@example.com'),
  ('approver', 'approver123', 'ผู้อนุมัติ', 'APPROVER', 'ACTIVE', 'approver@example.com'),
  ('user', 'user123', 'ผู้ใช้งานทั่วไป', 'USER', 'ACTIVE', 'user@example.com')
ON CONFLICT (username) DO NOTHING;

-- Insert sample rooms
INSERT INTO rooms (room_name, location, capacity, equipment, image_url, status) VALUES
  ('ห้องประชุม A', 'อาคาร 1 ชั้น 2', 10, 'โปรเจคเตอร์, ไมโครโฟน', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800', 'ACTIVE'),
  ('ห้องบรรยาย B', 'อาคาร 2 ชั้น 1', 50, 'เครื่องเสียง, จอ LED', 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800', 'ACTIVE'),
  ('ห้องประชุมเล็ก C', 'อาคาร 1 ชั้น 3', 6, 'ทีวี, ไวท์บอร์ด', 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&q=80&w=800', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to rooms
CREATE POLICY "Allow public read rooms" ON rooms
  FOR SELECT USING (true);

-- Allow public read access to users (for join queries)
CREATE POLICY "Allow public read users" ON users
  FOR SELECT USING (true);

-- Allow public read access to bookings
CREATE POLICY "Allow public read bookings" ON bookings
  FOR SELECT USING (true);

-- Allow authenticated operations
CREATE POLICY "Allow insert rooms" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update rooms" ON rooms
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete rooms" ON rooms
  FOR DELETE USING (true);

CREATE POLICY "Allow insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update bookings" ON bookings
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete bookings" ON bookings
  FOR DELETE USING (true);

-- ============================================
-- Storage Bucket for Room Images
-- ============================================
-- Note: Run this in SQL Editor after creating the bucket manually
-- Or create bucket via Supabase Dashboard: Storage > New Bucket > "room-images" (public)

-- Storage Policies (run after creating bucket)
-- Allow public read access
INSERT INTO storage.buckets (id, name, public) 
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read images
CREATE POLICY "Allow public read room images" ON storage.objects
  FOR SELECT USING (bucket_id = 'room-images');

-- Allow authenticated insert
CREATE POLICY "Allow insert room images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'room-images');

-- Allow authenticated update
CREATE POLICY "Allow update room images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'room-images');

-- Allow authenticated delete
CREATE POLICY "Allow delete room images" ON storage.objects
  FOR DELETE USING (bucket_id = 'room-images');