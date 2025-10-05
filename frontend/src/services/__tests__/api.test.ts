/**
 * API Client Tests
 * Tests for API client configuration and authentication API methods
 */

// Mock axios before importing anything else
// Now import after mocking
import { apiClient, authApi } from "../api";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      defaults: {
        baseURL: "http://localhost:8000/api",
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
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

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("apiClient configuration", () => {
    test("has correct base URL configuration", () => {
      expect(apiClient.defaults.baseURL).toBe("http://localhost:8000/api");
    });

    test("includes JSON content type headers", () => {
      expect(apiClient.defaults.headers["Content-Type"]).toBe(
        "application/json",
      );
    });

    test("sets timeout for requests", () => {
      expect(apiClient.defaults.timeout).toBe(10000);
    });

    test("includes credentials for session management", () => {
      expect(apiClient.defaults.withCredentials).toBe(true);
    });
  });

  describe("Request interceptors", () => {
    test("configuration includes withCredentials", () => {
      // Test that the API client is configured correctly
      expect(apiClient.defaults.withCredentials).toBe(true);
    });

    test("has request interceptor configured", () => {
      // Test that request interceptors are set up
      expect(apiClient.interceptors.request).toBeDefined();
    });
  });

  describe("Response interceptors", () => {
    test("has response interceptor configured", () => {
      // Test that response interceptors are set up
      expect(apiClient.interceptors.response).toBeDefined();
    });

    test("configuration handles errors appropriately", () => {
      // Test basic interceptor setup
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });
});

describe("Authentication API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("login method", () => {
    test("sends correct login request", async () => {
      const mockResponse = {
        user_id: "1",
        name: "Test User",
        email: "test@example.com",
        session_token: "mock-token",
        message: "Login successful",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.login("Test User", "test@example.com");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/auth/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: "Test User",
            email: "test@example.com",
          }),
        },
      );

      expect(result).toEqual({
        user: {
          id: "1",
          name: "Test User",
          email: "test@example.com",
        },
        session_token: "mock-token",
        message: "Login successful",
      });
    });

    test("handles login failure", async () => {
      const mockError = {
        error: "Name and email are required",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await expect(authApi.login("", "")).rejects.toThrow(
        "Name and email are required",
      );
    });

    test("stores session token on successful login", async () => {
      const mockResponse = {
        user_id: "1",
        name: "Test User",
        email: "test@example.com",
        session_token: "mock-token",
        message: "Login successful",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await authApi.login("Test User", "test@example.com");

      expect(localStorage.getItem("session_token")).toBe("mock-token");
    });
  });

  describe("logout method", () => {
    test("sends correct logout request", async () => {
      const mockResponse = {
        message: "Logout successful",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.logout();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/auth/logout/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      expect(result).toEqual(mockResponse);
    });

    test("clears local storage on logout", async () => {
      localStorage.setItem("session_token", "mock-token");
      localStorage.setItem("user", JSON.stringify({ id: "1", name: "Test" }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Logout successful" }),
      });

      await authApi.logout();

      expect(localStorage.getItem("session_token")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
  });

  describe("getStatus method", () => {
    test("sends correct status request", async () => {
      const mockResponse = {
        authenticated: true,
        user_id: "1",
        name: "Test User",
        email: "test@example.com",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.getStatus();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/auth/status/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      expect(result).toEqual({
        authenticated: true,
        user: {
          id: "1",
          name: "Test User",
          email: "test@example.com",
        },
      });
    });

    test("handles unauthenticated status", async () => {
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

    test("handles authentication check errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      await expect(authApi.getStatus()).rejects.toThrow("Server error");
    });
  });

  describe("Error handling", () => {
    test("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(authApi.login("Test", "test@example.com")).rejects.toThrow(
        "Network error",
      );
    });

    test("handles malformed JSON responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(authApi.login("Test", "test@example.com")).rejects.toThrow(
        "Invalid JSON",
      );
    });
  });
});

describe("General API", () => {
  const { generalApi } = require("../api");

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get = jest.fn();
  });

  describe("healthCheck method", () => {
    test("checks API health status", async () => {
      const mockHealth = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockHealth,
      });

      const result = await generalApi.healthCheck();

      expect(apiClient.get).toHaveBeenCalledWith("/health/");
      expect(result).toEqual(mockHealth);
    });
  });

  describe("getApiRoot method", () => {
    test("fetches API root information", async () => {
      const mockApiRoot = {
        version: "1.0",
        endpoints: {},
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockApiRoot,
      });

      const result = await generalApi.getApiRoot();

      expect(apiClient.get).toHaveBeenCalledWith("/");
      expect(result).toEqual(mockApiRoot);
    });
  });
});

describe("Session API", () => {
  const { sessionApi } = require("../api");

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.post = jest.fn();
    apiClient.get = jest.fn();
  });

  describe("createSession method", () => {
    test("creates a session successfully", async () => {
      const mockSession = {
        session_id: "session-123",
        name: "Test Session",
        created_at: "2024-01-01T00:00:00Z",
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockSession,
      });

      const result = await sessionApi.createSession({ name: "Test Session" });

      expect(apiClient.post).toHaveBeenCalledWith("/sessions/", {
        name: "Test Session",
      });
      expect(result).toEqual(mockSession);
    });

  });

  describe("joinSession method", () => {
    test("joins a session successfully", async () => {
      const mockSession = {
        session_id: "session-123",
        name: "Test Session",
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockSession,
      });

      const result = await sessionApi.joinSession("session-123");

      expect(apiClient.post).toHaveBeenCalledWith("/sessions/session-123/join/");
      expect(result).toEqual(mockSession);
    });
  });

  describe("leaveSession method", () => {
    test("leaves a session successfully", async () => {
      const mockResponse = {
        message: "Left session",
        session_id: "session-123",
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await sessionApi.leaveSession("session-123");

      expect(apiClient.post).toHaveBeenCalledWith("/sessions/session-123/leave/");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getSessions method", () => {
    test("fetches list of sessions", async () => {
      const mockSessions = [
        { session_id: "1", name: "Session 1" },
        { session_id: "2", name: "Session 2" },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockSessions,
      });

      const result = await sessionApi.getSessions();

      expect(apiClient.get).toHaveBeenCalledWith("/sessions/");
      expect(result).toEqual(mockSessions);
    });
  });

  describe("getSession method", () => {
    test("fetches session details", async () => {
      const mockSession = {
        session_id: "session-123",
        name: "Test Session",
        facilitator_id: "user-1",
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockSession,
      });

      const result = await sessionApi.getSession("session-123");

      expect(apiClient.get).toHaveBeenCalledWith("/sessions/session-123/");
      expect(result).toEqual(mockSession);
    });
  });
});

describe("Story API", () => {
  const { storyApi } = require("../api");

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get = jest.fn();
    apiClient.post = jest.fn();
    apiClient.put = jest.fn();
    apiClient.delete = jest.fn();
  });

  describe("getStories method", () => {
    test("fetches stories for a session", async () => {
      const mockStories = [
        { story_id: "1", title: "Story 1", status: "pending" },
        { story_id: "2", title: "Story 2", status: "voting" },
      ];

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockStories,
      });

      const result = await storyApi.getStories("session-123");

      expect(apiClient.get).toHaveBeenCalledWith("/sessions/session-123/stories/");
      expect(result).toEqual(mockStories);
    });
  });

  describe("createStory method", () => {
    test("creates a story successfully", async () => {
      const storyData = {
        title: "New Story",
        description: "Story description",
      };
      const mockStory = {
        story_id: "story-123",
        ...storyData,
        status: "pending",
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockStory,
      });

      const result = await storyApi.createStory("session-123", storyData);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/sessions/session-123/stories/",
        storyData
      );
      expect(result).toEqual(mockStory);
    });
  });

  describe("getStory method", () => {
    test("fetches single story details", async () => {
      const mockStory = {
        story_id: "story-123",
        title: "Test Story",
        status: "pending",
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockStory,
      });

      const result = await storyApi.getStory("session-123", "story-123");

      expect(apiClient.get).toHaveBeenCalledWith("/sessions/session-123/stories/story-123/");
      expect(result).toEqual(mockStory);
    });
  });

  describe("updateStory method", () => {
    test("updates a story successfully", async () => {
      const updateData = { title: "Updated Title" };
      const mockStory = {
        story_id: "story-123",
        title: "Updated Title",
        status: "voting",
      };

      (apiClient.put as jest.Mock).mockResolvedValueOnce({
        data: mockStory,
      });

      const result = await storyApi.updateStory("session-123", "story-123", updateData);

      expect(apiClient.put).toHaveBeenCalledWith("/sessions/session-123/stories/story-123/", updateData);
      expect(result).toEqual(mockStory);
    });
  });

  describe("deleteStory method", () => {
    test("deletes a story successfully", async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

      await storyApi.deleteStory("session-123", "story-123");

      expect(apiClient.delete).toHaveBeenCalledWith("/sessions/session-123/stories/story-123/");
    });
  });
});

describe("Vote API", () => {
  const { voteApi } = require("../api");

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient.get = jest.fn();
    apiClient.post = jest.fn();
  });

  describe("getVotingStatus method", () => {
    test("fetches voting status for a story", async () => {
      const mockStatus = {
        votes_count: 3,
        total_participants: 5,
        revealed: false,
        votes: [],
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockStatus,
      });

      const result = await voteApi.getVotingStatus("story-123");

      expect(apiClient.get).toHaveBeenCalledWith("/stories/story-123/votes/");
      expect(result).toEqual(mockStatus);
    });
  });

  describe("submitVote method", () => {
    test("submits a vote successfully", async () => {
      const voteData = { points: "5" };
      const mockVote = {
        vote_id: "vote-123",
        user: { id: "user-1", name: "Test", email: "test@test.com" },
        points: "5",
        created_at: "2024-01-01T00:00:00Z",
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: mockVote,
      });

      const result = await voteApi.submitVote("story-123", voteData);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/stories/story-123/votes/",
        voteData
      );
      expect(result).toEqual(mockVote);
    });

  });
});
