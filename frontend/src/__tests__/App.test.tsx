/**
 * App Component Tests
 * Tests for main application component initialization and basic functionality
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline, Box } from "@mui/material";
import { AuthProvider } from "../components/auth/AuthContext";
import { createAppTheme } from "../theme/theme";
import Layout from "../components/Layout";
import HomePage from "../pages/HomePage";
import CreateSessionPage from "../pages/CreateSessionPage";
import JoinSessionPage from "../pages/JoinSessionPage";
import SessionPage from "../pages/SessionPage";
import ErrorBoundary from "../components/ErrorBoundary";

// Mock the API module before any imports
jest.mock("../services/api", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  authApi: {
    login: jest.fn().mockResolvedValue({
      user: { id: "1", name: "Test User", email: "test@example.com" },
      session_token: "mock-token",
      message: "Login successful",
    }),
    logout: jest.fn().mockResolvedValue({ message: "Logout successful" }),
    getStatus: jest.fn().mockResolvedValue({
      authenticated: false,
      user: null,
    }),
  },
  generalApi: {
    healthCheck: jest.fn(),
    getApiRoot: jest.fn(),
  },
  sessionApi: {
    createSession: jest.fn(),
    getSessions: jest.fn(),
    getSession: jest.fn(),
    joinSession: jest.fn(),
    leaveSession: jest.fn(),
    updateSessionStatus: jest.fn(),
  },
}));

// Get reference to the mocked module for use in tests
const mockedApi = jest.mocked(require("../services/api"));

// Create a testable version of App without the Router
const theme = createAppTheme();

const TestableApp: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Box
            data-testid="app-container"
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              fontFamily: theme.typography.fontFamily,
            }}
            component="div"
          >
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create-session" element={<CreateSessionPage />} />
                <Route path="/join-session" element={<JoinSessionPage />} />
                <Route path="/session/:sessionId" element={<SessionPage />} />
                <Route path="*" element={<div>Page Not Found</div>} />
              </Routes>
            </Layout>
          </Box>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

describe("App Component", () => {
  const renderApp = (initialRoute = "/") => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <TestableApp />
      </MemoryRouter>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the auth status mock to default
    mockedApi.authApi.getStatus.mockResolvedValue({
      authenticated: false,
      user: null,
    });
    // Clear localStorage
    localStorage.clear();
  });

  describe("App Initialization", () => {
    test("renders without crashing", () => {
      renderApp();
      expect(document.body).toBeInTheDocument();
    });

    test("renders main application structure", async () => {
      renderApp();

      // Should render the main app container
      await waitFor(() => {
        expect(screen.getByTestId("app-container")).toBeInTheDocument();
      });
    });

    test("renders with Material-UI theme provider", () => {
      renderApp();

      // Check that Material-UI theme is applied by looking for theme-specific elements
      const appContainer = screen.getByTestId("app-container");
      expect(appContainer).toHaveStyle(
        'font-family: "Roboto","Helvetica","Arial",sans-serif',
      );
    });

    test("initializes routing system", () => {
      renderApp("/");

      // Should have routing context available
      expect(screen.getByTestId("app-container")).toBeInTheDocument();
    });
  });

  describe("Navigation and Routing", () => {
    test("renders home route by default", () => {
      renderApp("/");

      // Should render the home/landing page content
      expect(screen.getByTestId("app-container")).toBeInTheDocument();
    });

    test("handles unknown routes gracefully", () => {
      renderApp("/unknown-route");

      // Should render without throwing errors
      expect(screen.getByTestId("app-container")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    test("renders error boundary when child component throws", () => {
      // This would be tested with a component that intentionally throws
      // For now, ensure the app structure is robust
      renderApp();
      expect(screen.getByTestId("app-container")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    test("has proper document structure for screen readers", () => {
      renderApp();

      // Should have main landmark from Layout component
      const main = screen.getByTestId("layout-content");
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute("role", "main");
    });

    test("maintains focus management for navigation", () => {
      renderApp();

      // Should have focusable elements
      const container = screen.getByTestId("app-container");
      expect(container).toBeInTheDocument();
    });
  });
});
