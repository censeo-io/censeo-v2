/**
 * API Client Configuration
 * Handles HTTP requests to the Django backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  AuthStatusResponse,
  LogoutResponse
} from '../types/auth';
import {
  ApiResponse,
  ApiError,
  HealthCheckResponse,
  ApiRootResponse
} from '../types/api';

// API base URL from environment or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Request interceptor to add authentication headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear authentication data
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
      // Optionally redirect to login or refresh the page
    }

    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

// Generic API request helper
const handleApiRequest = async <T>(request: Promise<any>): Promise<T> => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Authentication API methods using fetch for direct backend communication
export const authApi = {
  async login(name: string, email: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store session token
    if (data.session_token) {
      localStorage.setItem('session_token', data.session_token);
    }

    return {
      user: {
        id: data.user_id,
        name: data.name,
        email: data.email,
      },
      session_token: data.session_token,
      message: data.message,
    };
  },

  async logout(): Promise<LogoutResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Logout failed');
    }

    // Clear local storage
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');

    return data;
  },

  async getStatus(): Promise<AuthStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/status/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check authentication status');
    }

    if (data.authenticated) {
      return {
        authenticated: true,
        user: {
          id: data.user_id,
          name: data.name,
          email: data.email,
        },
      };
    }

    return {
      authenticated: false,
      user: null,
    };
  },
};

// General API methods using axios
export const generalApi = {
  async healthCheck(): Promise<HealthCheckResponse> {
    return handleApiRequest<HealthCheckResponse>(
      apiClient.get('/health/')
    );
  },

  async getApiRoot(): Promise<ApiRootResponse> {
    return handleApiRequest<ApiRootResponse>(
      apiClient.get('/')
    );
  },
};

// Export configured axios instance for other services
export default apiClient;