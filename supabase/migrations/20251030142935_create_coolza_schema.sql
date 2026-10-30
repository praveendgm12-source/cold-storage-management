/*
  # Coolza Storage Management System

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `email` (text)
      - `role` (text) - "storageOwner" or "farmer"
      - `created_at` (timestamp)
    
    - `storage_units`
      - `id` (uuid, primary key)
      - `name` (text)
      - `location` (text)
      - `capacity` (numeric) - total capacity in kg
      - `available_space` (numeric) - current available space in kg
      - `price_per_kg` (numeric)
      - `owner_id` (uuid, references users)
      - `image_url` (text, optional)
      - `created_at` (timestamp)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `farmer_id` (uuid, references users)
      - `storage_id` (uuid, references storage_units)
      - `quantity` (numeric) - quantity booked in kg
      - `status` (text) - "pending", "confirmed", "rejected", "completed"
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can read their own profile
    - Users can update their own profile
    - Storage owners can manage their storage units
    - All authenticated users can view storage units
    - Farmers can create bookings
    - Storage owners can update booking status for their units
    - Users can view their own bookings
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('storageOwner', 'farmer')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create storage_units table
CREATE TABLE IF NOT EXISTS storage_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  capacity numeric NOT NULL CHECK (capacity > 0),
  available_space numeric NOT NULL CHECK (available_space >= 0 AND available_space <= capacity),
  price_per_kg numeric NOT NULL CHECK (price_per_kg > 0),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE storage_units ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_id uuid NOT NULL REFERENCES storage_units(id) ON DELETE CASCADE,
  quantity numeric NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for storage_units table
CREATE POLICY "Anyone authenticated can view storage units"
  ON storage_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Storage owners can create storage units"
  ON storage_units FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'storageOwner')
  );

CREATE POLICY "Storage owners can update own storage units"
  ON storage_units FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Storage owners can delete own storage units"
  ON storage_units FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for bookings table
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = farmer_id OR
    auth.uid() IN (SELECT owner_id FROM storage_units WHERE id = storage_id)
  );

CREATE POLICY "Farmers can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = farmer_id AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'farmer')
  );

CREATE POLICY "Storage owners can update booking status"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT owner_id FROM storage_units WHERE id = storage_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT owner_id FROM storage_units WHERE id = storage_id)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_storage_units_owner_id ON storage_units(owner_id);
CREATE INDEX IF NOT EXISTS idx_storage_units_available_space ON storage_units(available_space);
CREATE INDEX IF NOT EXISTS idx_bookings_farmer_id ON bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_storage_id ON bookings(storage_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
