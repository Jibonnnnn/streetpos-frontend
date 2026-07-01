export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  modifiers?: string[];
  availableFrom?: string;
  availableUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  employeeId?: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: number;
  fullName: string;
  token: string;
  role: string;
  expiresAt: string;
}