/**
 * Authentication-related type definitions
 */

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  name: string;
  email: string;
}

export interface LoginResponse {
  user: User;
  session_token: string;
  message: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user: User | null;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
}
