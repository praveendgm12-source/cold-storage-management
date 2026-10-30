export type UserRole = 'storageOwner' | 'farmer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface StorageUnit {
  id: string;
  name: string;
  location: string;
  capacity: number;
  available_space: number;
  price_per_kg: number;
  owner_id: string;
  image_url?: string;
  district?: string;
  address?: string;
  item_type?: string;
  source?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  farmer_id: string;
  storage_id: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  owner_id?: string;
  storage_name?: string;
  storage_location?: string;
  price_per_kg?: number;
  total_cost?: number;
  created_at: string;
}

// NOTE: Supabase client was removed as project is being migrated to Firebase.
// This file keeps the shared TypeScript types so other modules don't need mass edits.
