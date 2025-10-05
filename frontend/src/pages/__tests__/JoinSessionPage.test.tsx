/**
 * Tests for JoinSessionPage Component
 * Tests session joining functionality and validation
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import JoinSessionPage from "../JoinSessionPage";
import { createAppTheme } from "../../theme/theme";
import { useAuth } from "../../components/auth/AuthContext";
import { sessionApi } from "../../services/api";

// Mock AuthContext
jest.mock("../../components/auth/AuthContext");

// Mock the sessionApi
jest.mock("../../services/api", () => ({
  sessionApi: {
    joinSession: jest.fn(),
  },
}));

const mockSessionApi = sessionApi as jest.Mocked<typeof sessionApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const theme = createAppTheme();

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const renderJoinSessionPage = (initialRoute = "/join") => {
  const TestRouter = () => (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/join" element={<JoinSessionPage />} />
          <Route
            path="/session/:id"
            element={<div data-testid="session-page">Session Page</div>}
          />
          <Route path="/" element={<div data-testid="home-page">Home</div>} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  );

  return render(<TestRouter />);
};

describe("JoinSessionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
  });

  describe("Authentication", () => {
    it("should show warning when not authenticated", () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false } as any);

      renderJoinSessionPage();

      expect(
        screen.getByText("Please log in to join a session.")
      ).toBeInTheDocument();
    });

    it("should show form when authenticated", () => {
      renderJoinSessionPage();

      expect(screen.getByRole("heading", { name: "Join Session" })).toBeInTheDocument();
      expect(screen.getByLabelText(/Session ID/i)).toBeInTheDocument();
    });
  });

  describe("Form rendering", () => {
    it("should render all form elements", () => {
      renderJoinSessionPage();

      expect(screen.getByLabelText(/Session ID/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Join Session" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("should show participant capabilities", () => {
      renderJoinSessionPage();

      expect(
        screen.getByText("As a participant, you will be able to:")
      ).toBeInTheDocument();
      expect(screen.getByText("View stories to estimate")).toBeInTheDocument();
      expect(screen.getByText("Cast your votes using story points")).toBeInTheDocument();
    });

    it("should show helper text", () => {
      renderJoinSessionPage();

      expect(
        screen.getByText(/Session ID is a unique identifier/i)
      ).toBeInTheDocument();
    });
  });

  describe("Form validation", () => {
    it("should disable submit button when session ID is empty", () => {
      renderJoinSessionPage();

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when session ID is provided", () => {
      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      expect(submitButton).not.toBeDisabled();
    });

    it("should disable submit button for empty session ID", () => {
      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: "   " } }); // Whitespace only

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      expect(submitButton).toBeDisabled();
    });

    it("should show error for invalid session ID format", async () => {
      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: "invalid-id" } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Please enter a valid session ID")).toBeInTheDocument();
      });
    });

    it("should trim whitespace from session ID", async () => {
      mockSessionApi.joinSession.mockResolvedValueOnce({
        message: "Joined successfully",
        session: {
          session_id: VALID_UUID,
          name: "Test Session",
        } as any,
        user: { id: "user-1", name: "Test", email: "test@test.com" } as any,
      });

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: `  ${VALID_UUID}  ` } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSessionApi.joinSession).toHaveBeenCalledWith(VALID_UUID);
      });
    });
  });

  describe("Session joining", () => {
    it("should join session successfully", async () => {
      mockSessionApi.joinSession.mockResolvedValueOnce({
        message: "Joined successfully",
        session: {
          session_id: VALID_UUID,
          name: "Test Session",
        } as any,
        user: { id: "user-1", name: "Test", email: "test@test.com" } as any,
      });

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSessionApi.joinSession).toHaveBeenCalledWith(VALID_UUID);
      });
    });

    it("should show loading state during join", async () => {
      mockSessionApi.joinSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Joining...")).toBeInTheDocument();
      });

      expect(submitButton).toBeDisabled();
      expect(input).toBeDisabled();
    });

    it("should navigate to session page on success", async () => {
      mockSessionApi.joinSession.mockResolvedValueOnce({
        message: "Joined successfully",
        session: {
          session_id: VALID_UUID,
          name: "Test Session",
        } as any,
        user: { id: "user-1", name: "Test", email: "test@test.com" } as any,
      });

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("session-page")).toBeInTheDocument();
      });
    });

    it("should show error for session not found", async () => {
      mockSessionApi.joinSession.mockRejectedValueOnce(
        new Error("404 not found")
      );

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Session not found. Please check the session ID.")
        ).toBeInTheDocument();
      });
    });

    it("should show error for completed session", async () => {
      mockSessionApi.joinSession.mockRejectedValueOnce(
        new Error("Session has been completed")
      );

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("This session has been completed and cannot be joined.")
        ).toBeInTheDocument();
      });
    });

    it("should navigate to session if already joined", async () => {
      mockSessionApi.joinSession.mockRejectedValueOnce(
        new Error("User has already joined this session")
      );

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("session-page")).toBeInTheDocument();
      });
    });

    it("should show generic error for other failures", async () => {
      mockSessionApi.joinSession.mockRejectedValueOnce(
        new Error("Network error")
      );

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockSessionApi.joinSession.mockRejectedValueOnce("String error");

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to join session")).toBeInTheDocument();
      });
    });
  });

  describe("Cancel functionality", () => {
    it("should navigate to home page when cancel is clicked", async () => {
      renderJoinSessionPage();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByTestId("home-page")).toBeInTheDocument();
      });
    });

    it("should disable cancel button while loading", async () => {
      mockSessionApi.joinSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderJoinSessionPage();

      const input = screen.getByLabelText(/Session ID/i);
      fireEvent.change(input, { target: { value: VALID_UUID } });

      const submitButton = screen.getByRole("button", { name: "Join Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole("button", { name: "Cancel" });
        expect(cancelButton).toBeDisabled();
      });
    });
  });
});
