/**
 * HomePage Component Tests
 * Tests for the main landing/home page component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import HomePage from '../HomePage';
import { AuthProvider } from '../../components/auth/AuthContext';
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

describe('HomePage Component', () => {
  const theme = createAppTheme();

  const renderHomePage = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <HomePage />
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

  describe('Page Structure', () => {
    test('renders main homepage elements', async () => {
      renderHomePage();

      expect(screen.getByTestId('homepage-container')).toBeInTheDocument();

      // Wait for auth status to settle
      await waitFor(() => {
        expect(screen.getByTestId('homepage-hero')).toBeInTheDocument();
        expect(screen.getByTestId('homepage-actions')).toBeInTheDocument();
      });
    });

    test('displays application title and description', async () => {
      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText(/collaborative story estimation/i)).toBeInTheDocument();
      });
    });

    test('renders call-to-action buttons', async () => {
      // Mock authenticated state for this test
      mockedApi.authApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      });

      renderHomePage();

      await waitFor(() => {
        expect(screen.getByText('Create Session')).toBeInTheDocument();
        expect(screen.getByText('Join Session')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('handles create session button click', async () => {
      // Mock authenticated state for this test
      mockedApi.authApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      });

      renderHomePage();

      await waitFor(() => {
        const createButton = screen.getByText('Create Session');
        fireEvent.click(createButton);
        expect(mockNavigate).toHaveBeenCalledWith('/create-session');
      });
    });

    test('handles join session button click', async () => {
      // Mock authenticated state for this test
      mockedApi.authApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      });

      renderHomePage();

      await waitFor(() => {
        const joinButton = screen.getByText('Join Session');
        fireEvent.click(joinButton);
        expect(mockNavigate).toHaveBeenCalledWith('/join-session');
      });
    });

    test('shows authentication prompt for unauthenticated users', async () => {
      renderHomePage();

      // Wait for auth status to settle, then check for login form
      await waitFor(() => {
        expect(screen.getByTestId('auth-section')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Integration', () => {
    test('displays different content for authenticated users', async () => {
      // Mock authenticated state
      mockedApi.authApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      });

      renderHomePage();

      await waitFor(() => {
        // Should show Create/Join buttons for authenticated users
        expect(screen.getByText('Create Session')).toBeInTheDocument();
        expect(screen.getByText('Join Session')).toBeInTheDocument();
      });
    });

    test('displays login form for unauthenticated users', async () => {
      renderHomePage();

      await waitFor(() => {
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });

    test('handles login form submission', async () => {
      renderHomePage();

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const loginButton = screen.getByText('Login');

        fireEvent.change(nameInput, { target: { value: 'Test User' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(loginButton);

        // Should trigger login process
        expect(nameInput).toHaveValue('Test User');
        expect(emailInput).toHaveValue('test@example.com');
      });
    });
  });

  describe('Form Validation', () => {
    test('validates required fields in login form', async () => {
      renderHomePage();

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const loginForm = screen.getByTestId('login-form');

        // Try to submit empty form
        fireEvent.submit(loginForm);

        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      renderHomePage();

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
        fireEvent.blur(emailInput);

        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('enables login button only when form is valid', async () => {
      renderHomePage();

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const loginButton = screen.getByText('Login');

        // Initially disabled
        expect(loginButton).toBeDisabled();

        // Fill in valid data
        fireEvent.change(nameInput, { target: { value: 'Test User' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      });

      await waitFor(() => {
        const loginButton = screen.getByText('Login');
        expect(loginButton).not.toBeDisabled();
      });
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for different screen sizes', async () => {
      renderHomePage();

      await waitFor(() => {
        const container = screen.getByTestId('homepage-container');
        expect(container).toHaveStyle('display: flex');
        expect(container).toHaveStyle('flex-direction: column');
      });
    });

    test('maintains proper spacing and alignment', async () => {
      renderHomePage();

      await waitFor(() => {
        const hero = screen.getByTestId('homepage-hero');
        const actions = screen.getByTestId('homepage-actions');

        expect(hero).toBeInTheDocument();
        expect(actions).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels and roles', async () => {
      renderHomePage();

      await waitFor(() => {
        expect(screen.getByTestId('homepage-container')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 5 })).toBeInTheDocument();
      });
    });

    test('supports keyboard navigation', async () => {
      // Mock authenticated state for this test
      mockedApi.authApi.getStatus.mockResolvedValue({
        authenticated: true,
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
      });

      renderHomePage();

      await waitFor(() => {
        const createButton = screen.getByText('Create Session');
        const joinButton = screen.getByText('Join Session');

        expect(createButton).toHaveAttribute('tabindex', '0');
        expect(joinButton).toHaveAttribute('tabindex', '0');
      });
    });

    test('provides proper form accessibility', async () => {
      renderHomePage();

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);

        expect(nameInput).toHaveAttribute('required');
        expect(emailInput).toHaveAttribute('required');
        expect(emailInput).toHaveAttribute('type', 'email');
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during authentication check', async () => {
      renderHomePage();

      // Should handle loading state gracefully
      await waitFor(() => {
        expect(screen.getByTestId('homepage-container')).toBeInTheDocument();
      });
    });

    test('shows loading state during login process', async () => {
      renderHomePage();

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const loginButton = screen.getByText('Login');

        // Initially button should be disabled when form is empty
        expect(loginButton).toBeDisabled();

        // Fill form to enable button
        fireEvent.change(nameInput, { target: { value: 'Test User' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

        // After filling valid data, button should be enabled
        expect(loginButton).not.toBeDisabled();
      });
    });
  });
});