/**
 * Type definitions for authentication system
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: Date;
}

export interface AuthResponse {
  token: string;
  user?: User;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; data?: AuthResponse; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; data?: AuthResponse; error?: string }>;
  logout: () => Promise<void>;
}
