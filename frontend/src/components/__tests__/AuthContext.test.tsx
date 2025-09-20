/**
 * AuthContext Tests
 * Tests for authentication context provider and hooks
 */

import React from "react";
import { renderHook, act, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import { authApi } from "../../services/api";

// Mock the API module
jest.mock("../../services/api", () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    getStatus: jest.fn(),
  },
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Set default mock implementations
    mockedAuthApi.getStatus.mockResolvedValue({
      authenticated: false,
      user: null,
    });
    mockedAuthApi.login.mockResolvedValue({
      user: { id: "1", name: "Test User", email: "test@example.com" },
      session_token: "mock-token",
      message: "Login successful",
    });
    mockedAuthApi.logout.mockResolvedValue({
      message: "Logout successful",
    });
  });

  describe("AuthProvider", () => {
    const TestComponent: React.FC = () => {
      const { user, isAuthenticated, isLoading } = useAuth();
      return (
        <div>
          <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
          <div data-testid="is-loading">{isLoading.toString()}</div>
          <div data-testid="user-email">{user?.email || "No user"}</div>
        </div>
      );
    };

    const renderWithProvider = () => {
      return render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );
    };

    test("provides initial authentication state", async () => {
      renderWithProvider();

      // Wait for auth check to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      expect(screen.getByTestId("user-email")).toHaveTextContent("No user");
    });

    test("checks authentication status on mount", async () => {
      mockedAuthApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: { id: "1", email: "test@example.com", name: "Test User" },
      });

      renderWithProvider();

      // Wait for auth check to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should call getStatus on mount
      expect(mockedAuthApi.getStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe("useAuth hook", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    test("provides authentication methods", () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.login).toBeDefined();
      expect(result.current.logout).toBeDefined();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });

    test("handles successful login", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
      };
      mockedAuthApi.login.mockResolvedValue({
        user: mockUser,
        session_token: "mock-token",
        message: "Login successful",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("Test User", "test@example.com");
      });

      expect(mockedAuthApi.login).toHaveBeenCalledWith(
        "Test User",
        "test@example.com",
      );
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    test("handles login failure", async () => {
      mockedAuthApi.login.mockRejectedValue(new Error("Login failed"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await expect(
          result.current.login("Test User", "invalid@example.com"),
        ).rejects.toBeInstanceOf(Error);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    test("handles logout", async () => {
      mockedAuthApi.logout.mockResolvedValue({ message: "Logout successful" });

      // First setup authenticated state
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
      };
      mockedAuthApi.login.mockResolvedValue({
        user: mockUser,
        session_token: "mock-token",
        message: "Login successful",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      await act(async () => {
        await result.current.login("Test User", "test@example.com");
      });

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(mockedAuthApi.logout).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    test("persists authentication state in localStorage", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
      };
      mockedAuthApi.login.mockResolvedValue({
        user: mockUser,
        session_token: "mock-token",
        message: "Login successful",
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login("Test User", "test@example.com");
      });

      // Should store user data in localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      expect(storedUser).toEqual(mockUser);
    });

    test("restores authentication state from localStorage", () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        name: "Test User",
      };
      localStorage.setItem("user", JSON.stringify(mockUser));

      mockedAuthApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Should initially load from localStorage
      expect(result.current.user).toEqual(mockUser);
    });

    test("throws error when used outside of AuthProvider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow("useAuth must be used within an AuthProvider");

      console.error = originalError;
    });
  });

  describe("Authentication State Management", () => {
    test("manages loading state during authentication check", async () => {
      mockedAuthApi.getStatus.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ authenticated: false, user: null }),
              100,
            ),
          ),
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("handles authentication errors gracefully", async () => {
      mockedAuthApi.getStatus.mockRejectedValue(new Error("Network error"));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Should handle error gracefully and set loading to false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
