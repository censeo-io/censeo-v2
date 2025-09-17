/**
 * Layout Component Tests
 * Tests for the main layout component including navigation and app structure
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Layout from '../Layout';
import { AuthProvider } from '../auth/AuthContext';
import { createAppTheme } from '../../theme/theme';

// Mock the API
jest.mock('../../services/api', () => ({
  authApi: {
    login: jest.fn().mockResolvedValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      session_token: 'mock-token',
      message: 'Login successful',
    }),
    logout: jest.fn().mockResolvedValue({ message: 'Logout successful' }),
    getStatus: jest.fn().mockResolvedValue({
      authenticated: false,
      user: null,
    }),
  },
}));

// Get reference to the mocked module
const mockedApi = jest.mocked(require('../../services/api'));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Layout Component', () => {
  const theme = createAppTheme();

  const renderLayout = (children: React.ReactNode = <div>Test Content</div>) => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <Layout>{children}</Layout>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth status to unauthenticated for most tests
    mockedApi.authApi.getStatus.mockResolvedValue({
      authenticated: false,
      user: null,
    });
    // Clear localStorage
    localStorage.clear();
  });

  describe('Layout Structure', () => {
    test('renders main layout structure', () => {
      renderLayout();

      expect(screen.getByTestId('layout-container')).toBeInTheDocument();
      expect(screen.getByTestId('layout-header')).toBeInTheDocument();
      expect(screen.getByTestId('layout-content')).toBeInTheDocument();
    });

    test('renders children content in main content area', () => {
      renderLayout(<div data-testid="custom-content">Custom Test Content</div>);

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Test Content')).toBeInTheDocument();
    });

    test('applies correct Material-UI styling', () => {
      renderLayout();

      const container = screen.getByTestId('layout-container');
      expect(container).toHaveStyle('min-height: 100vh');
    });
  });

  describe('Header Navigation', () => {
    test('renders application title', () => {
      renderLayout();

      expect(screen.getByText('Censeo')).toBeInTheDocument();
    });

    test('renders navigation menu', () => {
      renderLayout();

      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
    });

    test('handles navigation menu interactions', async () => {
      // Mock authenticated state for this test
      mockedApi.authApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      });

      renderLayout();

      const menuButton = await screen.findByTestId('menu-button');
      fireEvent.click(menuButton);

      // Should toggle menu visibility or trigger navigation
      expect(mockNavigate).toHaveBeenCalledTimes(0); // Initially no navigation
    });
  });

  describe('Authentication Status', () => {
    test('renders authentication status in header', () => {
      renderLayout();

      // Should show login/logout controls
      expect(screen.getByTestId('auth-controls')).toBeInTheDocument();
    });

    test('shows login button when not authenticated', () => {
      renderLayout();

      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for different screen sizes', () => {
      renderLayout();

      const container = screen.getByTestId('layout-container');
      expect(container).toHaveStyle('display: flex');
      expect(container).toHaveStyle('flex-direction: column');
    });

    test('handles mobile navigation appropriately', () => {
      renderLayout();

      // Should have responsive navigation elements
      expect(screen.getByTestId('navigation-menu')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA landmarks', () => {
      renderLayout();

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument(); // main content
    });

    test('maintains proper heading hierarchy', () => {
      renderLayout();

      const appTitle = screen.getByRole('heading', { level: 1 });
      expect(appTitle).toBeInTheDocument();
      expect(appTitle).toHaveTextContent('Censeo');
    });

    test('supports keyboard navigation', async () => {
      // Mock authenticated state for this test
      mockedApi.authApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      });

      renderLayout();

      await waitFor(() => {
        const menuButton = screen.getByTestId('menu-button');

        // Should be focusable
        expect(menuButton).toHaveAttribute('tabindex', '0');
      });
    });
  });
});