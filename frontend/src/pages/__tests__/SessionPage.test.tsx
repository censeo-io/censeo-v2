/**
 * Tests for SessionPage Component
 * Tests session page rendering and basic functionality
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import SessionPage from "../SessionPage";
import { createAppTheme } from "../../theme/theme";
import { useAuth } from "../../components/auth/AuthContext";
import { sessionApi } from "../../services/api";

// Mock AuthContext
jest.mock("../../components/auth/AuthContext");

// Mock the sessionApi
jest.mock("../../services/api", () => ({
  sessionApi: {
    getSession: jest.fn(),
    leaveSession: jest.fn(),
  },
  storyApi: {
    getStories: jest.fn(),
    createStory: jest.fn(),
    updateStory: jest.fn(),
    deleteStory: jest.fn(),
  },
}));

const mockSessionApi = sessionApi as jest.Mocked<typeof sessionApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const theme = createAppTheme();

const mockSession = {
  session_id: "session-123",
  name: "Test Session",
  facilitator: {
    id: "user-1",
    name: "Facilitator",
    email: "facilitator@test.com",
  },
  participants: [
    { id: "user-1", name: "Facilitator", email: "facilitator@test.com" },
    { id: "user-2", name: "Participant", email: "participant@test.com" },
  ],
  status: "active",
  created_at: "2024-01-01T00:00:00Z",
  participant_count: 2,
  updated_at: "2024-01-01T00:00:00Z",
} as any;

const renderSessionPage = (sessionId = "session-123") => {
  return render(
    <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe("SessionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-1", name: "Test User", email: "test@test.com" },
    } as any);
  });

  describe("Authentication", () => {
    it("should show message when not authenticated", async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false } as any);

      renderSessionPage();

      await waitFor(() => {
        expect(
          screen.getByText(/Please log in to view this session/i)
        ).toBeInTheDocument();
      });
    });

    it("should load session when authenticated", async () => {
      mockSessionApi.getSession.mockResolvedValueOnce(mockSession);

      renderSessionPage();

      await waitFor(() => {
        expect(mockSessionApi.getSession).toHaveBeenCalledWith("session-123");
      });
    });
  });

  describe("Loading state", () => {
    it("should show loading indicator initially", () => {
      mockSessionApi.getSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderSessionPage();

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("should show error message when session load fails", async () => {
      mockSessionApi.getSession.mockRejectedValueOnce(new Error("Network error"));

      renderSessionPage();

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should show not found error for 404", async () => {
      mockSessionApi.getSession.mockRejectedValueOnce(new Error("404 not found"));

      renderSessionPage();

      await waitFor(() => {
        expect(
          screen.getByText(/Session not found or you do not have access to it/i)
        ).toBeInTheDocument();
      });
    });
  });
});
