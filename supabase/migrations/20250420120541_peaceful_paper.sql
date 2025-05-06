/*
  # Initial schema for Padel Court Reservation System

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text, default 'client')
      - `created_at` (timestamptz, default now())
    - `courts`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `price_per_hour` (numeric, not null)
      - `image_url` (text)
      - `status` (enum: available, reserved, maintenance, default 'available')
    - `reservations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `court_id` (uuid, references courts.id)
      - `start_time` (timestamptz, not null)
      - `end_time` (timestamptz, not null)
      - `total_price` (numeric, not null)
      - `status` (enum: pending, confirmed, cancelled, default 'pending')
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on all tables
    - Create policies for each table to control access based on user role
*/

-- Create enum types
CREATE TYPE court_status AS ENUM ('available', 'reserved', 'maintenance');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- Create profiles table to store user roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create courts table
CREATE TABLE IF NOT EXISTS courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_per_hour NUMERIC NOT NULL CHECK (price_per_hour >= 0),
  image_url TEXT,
  status court_status DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  status reservation_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure end_time is after start_time
  CONSTRAINT reservations_timeframe_check CHECK (end_time > start_time)
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Admin can read all profiles
CREATE POLICY admin_read_profiles
  ON profiles
  FOR SELECT
  TO authenticated
  USING (role = 'admin');

-- Users can read their own profile
CREATE POLICY users_read_own_profile
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Courts policies
-- Anyone can read courts
CREATE POLICY courts_read_all
  ON courts
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert, update, delete courts
CREATE POLICY admin_insert_courts
  ON courts
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY admin_update_courts
  ON courts
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY admin_delete_courts
  ON courts
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Reservations policies
-- Admin can read all reservations
CREATE POLICY admin_read_reservations
  ON reservations
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Users can read their own reservations
CREATE POLICY users_read_own_reservations
  ON reservations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert reservations for themselves
CREATE POLICY users_insert_reservations
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reservations with pending status
CREATE POLICY users_update_own_reservations
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Admins can update any reservation
CREATE POLICY admin_update_reservations
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Insert sample data
-- Add a default admin user (this would be adjusted in a real application)
INSERT INTO profiles (id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin');

-- Add sample courts
INSERT INTO courts (name, description, price_per_hour, image_url, status)
VALUES 
  ('Court 1', 'Professional court with top-quality playing surface and lighting.', 30.00, 'https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg', 'available'),
  ('Court 2', 'Indoor court with climate control, perfect for all-weather play.', 35.00, 'https://images.pexels.com/photos/1103829/pexels-photo-1103829.jpeg', 'available'),
  ('Court 3', 'Beginners court with instructor support available.', 25.00, 'https://images.pexels.com/photos/8224681/pexels-photo-8224681.jpeg', 'available'),
  ('Court 4', 'Competition grade court with seating for spectators.', 40.00, 'https://images.pexels.com/photos/2403406/pexels-photo-2403406.jpeg', 'maintenance');