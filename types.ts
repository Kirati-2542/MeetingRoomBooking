export enum UserRole {
  USER = 'USER',
  APPROVER = 'APPROVER',
  ADMIN = 'ADMIN',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Room {
  id: string;
  room_name: string;
  location: string;
  capacity: number;
  equipment: string;
  image_url?: string;
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  title: string;
  purpose: string;
  start_datetime: string;
  end_datetime: string;
  status: BookingStatus;
  approver_id?: string;
  approved_at?: string;
  created_at: string;
  rooms?: Room; // Joined data
  users?: User; // Joined data
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}