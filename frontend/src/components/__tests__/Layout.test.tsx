/**
 * Tests for Layout Component
 * Tests basic layout rendering
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import Layout from "../Layout";
import { createAppTheme } from "../../theme/theme";
import { useAuth } from "../auth/AuthContext";

// Mock AuthContext
jest.mock("../auth/AuthContext");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const theme = createAppTheme();

const renderLayout = (children: React.ReactNode = <div>Test Content</div>) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <Layout>{children}</Layout>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe("Layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
    } as any);
  });

  it("should render children content", () => {
    renderLayout(<div>Test Content</div>);

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("should render Censeo branding", () => {
    renderLayout();

    expect(screen.getByText("Censeo")).toBeInTheDocument();
  });

  it("should render login button when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
    } as any);

    renderLayout();

    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
  });

  it("should render user menu when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", name: "Test User", email: "test@test.com" },
      logout: jest.fn(),
    } as any);

    renderLayout();

    expect(screen.getByRole("button", { name: /account menu/i })).toBeInTheDocument();
  });

  it("should open user menu when account button is clicked", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", name: "Test User", email: "test@test.com" },
      logout: jest.fn(),
    } as any);

    renderLayout();

    const accountButton = screen.getByRole("button", { name: /account menu/i });
    fireEvent.click(accountButton);

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: /Logout/i })).toBeInTheDocument();
    });
  });

  it("should call logout when logout menu item is clicked", async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", name: "Test User", email: "test@test.com" },
      logout: mockLogout,
    } as any);

    renderLayout();

    const accountButton = screen.getByRole("button", { name: /account menu/i });
    fireEvent.click(accountButton);

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: /Logout/i })).toBeInTheDocument();
    });

    const logoutMenuItem = screen.getByRole("menuitem", { name: /Logout/i });
    fireEvent.click(logoutMenuItem);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
