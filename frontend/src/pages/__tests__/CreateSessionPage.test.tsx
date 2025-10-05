/**
 * Tests for CreateSessionPage Component
 * Tests session creation functionality and validation
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CreateSessionPage from "../CreateSessionPage";
import { createAppTheme } from "../../theme/theme";
import { useAuth } from "../../components/auth/AuthContext";
import { sessionApi } from "../../services/api";

// Mock AuthContext
jest.mock("../../components/auth/AuthContext");

// Mock the sessionApi
jest.mock("../../services/api", () => ({
  sessionApi: {
    createSession: jest.fn(),
  },
}));

const mockSessionApi = sessionApi as jest.Mocked<typeof sessionApi>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const theme = createAppTheme();

const renderCreateSessionPage = (initialRoute = "/create") => {
  const TestRouter = () => (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/create" element={<CreateSessionPage />} />
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

describe("CreateSessionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true } as any);
  });

  describe("Authentication", () => {
    it("should show warning when not authenticated", () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false } as any);

      renderCreateSessionPage();

      expect(
        screen.getByText("Please log in to create a session.")
      ).toBeInTheDocument();
    });

    it("should show form when authenticated", () => {
      renderCreateSessionPage();

      expect(screen.getByText("Create New Session")).toBeInTheDocument();
      expect(screen.getByLabelText(/Session Name/i)).toBeInTheDocument();
    });
  });

  describe("Form rendering", () => {
    it("should render all form elements", () => {
      renderCreateSessionPage();

      expect(screen.getByLabelText(/Session Name/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Session" })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("should show facilitator capabilities", () => {
      renderCreateSessionPage();

      expect(
        screen.getByText("As the facilitator, you will be able to:")
      ).toBeInTheDocument();
      expect(screen.getByText("Add stories to estimate")).toBeInTheDocument();
      expect(screen.getByText("Control the voting rounds")).toBeInTheDocument();
    });

    it("should show character counter", () => {
      renderCreateSessionPage();

      expect(screen.getByText("0/200 characters")).toBeInTheDocument();
    });

    it("should update character counter when typing", () => {
      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "Test Session" } });

      expect(screen.getByText("12/200 characters")).toBeInTheDocument();
    });
  });

  describe("Form validation", () => {
    it("should disable submit button when session name is empty", () => {
      renderCreateSessionPage();

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when session name is provided", () => {
      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "Test Session" } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      expect(submitButton).not.toBeDisabled();
    });

    it("should disable submit button for empty session name", () => {
      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "   " } }); // Whitespace only

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      expect(submitButton).toBeDisabled();
    });

    it("should show error for session name exceeding 200 characters", async () => {
      renderCreateSessionPage();

      const longName = "a".repeat(201);
      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: longName } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Session name cannot exceed 200 characters")
        ).toBeInTheDocument();
      });
    });

    it("should trim whitespace from session name", async () => {
      mockSessionApi.createSession.mockResolvedValueOnce({
        session_id: "session-123",
        name: "Test Session",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "  Test Session  " } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSessionApi.createSession).toHaveBeenCalledWith({
          name: "Test Session",
        });
      });
    });
  });

  describe("Session creation", () => {
    it("should create session successfully", async () => {
      mockSessionApi.createSession.mockResolvedValueOnce({
        session_id: "session-123",
        name: "Test Session",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "Test Session" } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSessionApi.createSession).toHaveBeenCalledWith({
          name: "Test Session",
        });
      });
    });

    it("should show loading state during creation", async () => {
      mockSessionApi.createSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "Test Session" } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Creating...")).toBeInTheDocument();
      });

      expect(submitButton).toBeDisabled();
      expect(input).toBeDisabled();
    });

    it("should disable cancel button while loading", async () => {
      mockSessionApi.createSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "Test Session" } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole("button", { name: "Cancel" });
        expect(cancelButton).toBeDisabled();
      });
    });

    it("should navigate to session page on success", async () => {
      mockSessionApi.createSession.mockResolvedValueOnce({
        session_id: "session-123",
        name: "Test Session",
        created_at: "2024-01-01T00:00:00Z",
      } as any);

      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "Test Session" } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("session-page")).toBeInTheDocument();
      });
    });

    it("should show error message on creation failure", async () => {
      mockSessionApi.createSession.mockRejectedValueOnce(
        new Error("Network error")
      );

      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "Test Session" } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockSessionApi.createSession.mockRejectedValueOnce("String error");

      renderCreateSessionPage();

      const input = screen.getByLabelText(/Session Name/i);
      fireEvent.change(input, { target: { value: "Test Session" } });

      const submitButton = screen.getByRole("button", { name: "Create Session" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to create session")).toBeInTheDocument();
      });
    });
  });

  describe("Cancel functionality", () => {
    it("should navigate to home page when cancel is clicked", async () => {
      renderCreateSessionPage();

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByTestId("home-page")).toBeInTheDocument();
      });
    });
  });
});
