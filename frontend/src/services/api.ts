/**
 * API Client Configuration
 * Handles HTTP requests to the Django backend API
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import {
  LoginResponse,
  AuthStatusResponse,
  LogoutResponse,
} from "../types/auth";
import { HealthCheckResponse, ApiRootResponse } from "../types/api";
import {
  Session,
  CreateSessionRequest,
  CreateSessionResponse,
  JoinSessionResponse,
  SessionListResponse,
} from "../types/session";
import {
  Story,
  CreateStoryRequest,
  UpdateStoryRequest,
  StoryListResponse,
} from "../types/story";

// API base URL from environment or default to localhost
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Create axios instance with default configuration
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies for session management
});

// Function to get CSRF token from cookies (Django standard approach)
const getCSRFToken = (): string | null => {
  // Get CSRF token from cookies (Django sets 'csrftoken' cookie)
  const name = "csrftoken";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

// Request interceptor to add authentication headers and CSRF token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("session_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    if (
      ["post", "put", "patch", "delete"].includes(
        config.method?.toLowerCase() || "",
      )
    ) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear authentication data
      localStorage.removeItem("session_token");
      localStorage.removeItem("user");
      // Optionally redirect to login or refresh the page
    }

    // Log error for debugging
    console.error("API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  },
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
    // Get CSRF token from cookie
    const csrfToken = getCSRFToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ name, email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    // Store session token
    if (data.session_token) {
      localStorage.setItem("session_token", data.session_token);
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
    // Get CSRF token from cookie
    const csrfToken = getCSRFToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: "POST",
      headers,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Logout failed");
    }

    // Clear local storage
    localStorage.removeItem("session_token");
    localStorage.removeItem("user");

    return data;
  },

  async getStatus(): Promise<AuthStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/status/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to check authentication status");
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
    return handleApiRequest<HealthCheckResponse>(apiClient.get("/health/"));
  },

  async getApiRoot(): Promise<ApiRootResponse> {
    return handleApiRequest<ApiRootResponse>(apiClient.get("/"));
  },
};

// Session API methods
export const sessionApi = {
  async createSession(
    sessionData: CreateSessionRequest,
  ): Promise<CreateSessionResponse> {
    return handleApiRequest<CreateSessionResponse>(
      apiClient.post("/sessions/", sessionData),
    );
  },

  async getSessions(): Promise<SessionListResponse> {
    return handleApiRequest<SessionListResponse>(apiClient.get("/sessions/"));
  },

  async getSession(sessionId: string): Promise<Session> {
    return handleApiRequest<Session>(apiClient.get(`/sessions/${sessionId}/`));
  },

  async joinSession(sessionId: string): Promise<JoinSessionResponse> {
    return handleApiRequest<JoinSessionResponse>(
      apiClient.post(`/sessions/${sessionId}/join/`),
    );
  },

  async leaveSession(
    sessionId: string,
  ): Promise<{ message: string; session_id: string }> {
    return handleApiRequest<{ message: string; session_id: string }>(
      apiClient.post(`/sessions/${sessionId}/leave/`),
    );
  },

  async updateSessionStatus(
    sessionId: string,
    status: "active" | "completed" | "paused",
  ): Promise<{ message: string; session: Session }> {
    return handleApiRequest<{ message: string; session: Session }>(
      apiClient.post(`/sessions/${sessionId}/status/`, { status }),
    );
  },
};

// Story API methods
export const storyApi = {
  async getStories(sessionId: string): Promise<StoryListResponse> {
    return handleApiRequest<StoryListResponse>(
      apiClient.get(`/sessions/${sessionId}/stories/`),
    );
  },

  async createStory(
    sessionId: string,
    storyData: CreateStoryRequest,
  ): Promise<Story> {
    return handleApiRequest<Story>(
      apiClient.post(`/sessions/${sessionId}/stories/`, storyData),
    );
  },

  async getStory(sessionId: string, storyId: string): Promise<Story> {
    return handleApiRequest<Story>(
      apiClient.get(`/sessions/${sessionId}/stories/${storyId}/`),
    );
  },

  async updateStory(
    sessionId: string,
    storyId: string,
    storyData: UpdateStoryRequest,
  ): Promise<Story> {
    return handleApiRequest<Story>(
      apiClient.put(`/sessions/${sessionId}/stories/${storyId}/`, storyData),
    );
  },

  async deleteStory(sessionId: string, storyId: string): Promise<void> {
    return handleApiRequest<void>(
      apiClient.delete(`/sessions/${sessionId}/stories/${storyId}/`),
    );
  },
};

// Export configured axios instance for other services
export default apiClient;
