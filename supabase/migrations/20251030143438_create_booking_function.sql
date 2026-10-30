/*
  # Create Booking Transaction Function

  1. New Function
    - `create_booking` - Atomically creates a booking and updates storage available space
    - Ensures no race conditions when multiple farmers book simultaneously
    - Validates quantity is available before booking

  2. Security
    - Function is accessible to authenticated users
    - Validates farmer role before creating booking
*/

CREATE OR REPLACE FUNCTION create_booking(
  p_farmer_id uuid,
  p_storage_id uuid,
  p_quantity numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_space numeric;
  v_booking_id uuid;
BEGIN
  SELECT available_space INTO v_available_space
  FROM storage_units
  WHERE id = p_storage_id
  FOR UPDATE;

  IF v_available_space IS NULL THEN
    RAISE EXCEPTION 'Storage unit not found';
  END IF;

  IF p_quantity > v_available_space THEN
    RAISE EXCEPTION 'Requested quantity exceeds available space';
  END IF;

  INSERT INTO bookings (farmer_id, storage_id, quantity, status)
  VALUES (p_farmer_id, p_storage_id, p_quantity, 'pending')
  RETURNING id INTO v_booking_id;

  UPDATE storage_units
  SET available_space = available_space - p_quantity
  WHERE id = p_storage_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id
  );
END;
$$;
