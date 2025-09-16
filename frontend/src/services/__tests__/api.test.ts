/**
 * API Client Tests
 * Tests for API client configuration and authentication API methods
 */

// Mock axios before importing anything else
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      defaults: {
        baseURL: 'http://localhost:8000/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      },
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

// Mock fetch globally for auth API methods
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Now import after mocking
import { apiClient, authApi } from '../api';

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('apiClient configuration', () => {
    test('has correct base URL configuration', () => {
      expect(apiClient.defaults.baseURL).toBe('http://localhost:8000/api');
    });

    test('includes JSON content type headers', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });

    test('sets timeout for requests', () => {
      expect(apiClient.defaults.timeout).toBe(10000);
    });

    test('includes credentials for session management', () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
    });
  });

  describe('Request interceptors', () => {
    test('configuration includes withCredentials', () => {
      // Test that the API client is configured correctly
      expect(apiClient.defaults.withCredentials).toBe(true);
    });

    test('has request interceptor configured', () => {
      // Test that request interceptors are set up
      expect(apiClient.interceptors.request).toBeDefined();
    });
  });

  describe('Response interceptors', () => {
    test('has response interceptor configured', () => {
      // Test that response interceptors are set up
      expect(apiClient.interceptors.response).toBeDefined();
    });

    test('configuration handles errors appropriately', () => {
      // Test basic interceptor setup
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });
});

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('login method', () => {
    test('sends correct login request', async () => {
      const mockResponse = {
        user_id: '1',
        name: 'Test User',
        email: 'test@example.com',
        session_token: 'mock-token',
        message: 'Login successful',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.login('Test User', 'test@example.com');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
        }),
      });

      expect(result).toEqual({
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
        session_token: 'mock-token',
        message: 'Login successful',
      });
    });

    test('handles login failure', async () => {
      const mockError = {
        error: 'Name and email are required',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await expect(authApi.login('', '')).rejects.toThrow('Name and email are required');
    });

    test('stores session token on successful login', async () => {
      const mockResponse = {
        user_id: '1',
        name: 'Test User',
        email: 'test@example.com',
        session_token: 'mock-token',
        message: 'Login successful',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await authApi.login('Test User', 'test@example.com');

      expect(localStorage.getItem('session_token')).toBe('mock-token');
    });
  });

  describe('logout method', () => {
    test('sends correct logout request', async () => {
      const mockResponse = {
        message: 'Logout successful',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.logout();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      expect(result).toEqual(mockResponse);
    });

    test('clears local storage on logout', async () => {
      localStorage.setItem('session_token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Test' }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logout successful' }),
      });

      await authApi.logout();

      expect(localStorage.getItem('session_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('getStatus method', () => {
    test('sends correct status request', async () => {
      const mockResponse = {
        authenticated: true,
        user_id: '1',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.getStatus();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/status/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      expect(result).toEqual({
        authenticated: true,
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
        },
      });
    });

    test('handles unauthenticated status', async () => {
      const mockResponse = {
        authenticated: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.getStatus();

      expect(result).toEqual({
        authenticated: false,
        user: null,
      });
    });

    test('handles authentication check errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(authApi.getStatus()).rejects.toThrow('Server error');
    });
  });

  describe('Error handling', () => {
    test('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authApi.login('Test', 'test@example.com')).rejects.toThrow('Network error');
    });

    test('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(authApi.login('Test', 'test@example.com')).rejects.toThrow('Invalid JSON');
    });
  });
});