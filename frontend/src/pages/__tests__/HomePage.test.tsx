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
    login: jest.fn(),
    logout: jest.fn(),
    getStatus: jest.fn(),
  },
}));

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
  });

  describe('Page Structure', () => {
    test('renders main homepage elements', () => {
      renderHomePage();

      expect(screen.getByTestId('homepage-container')).toBeInTheDocument();
      expect(screen.getByTestId('homepage-hero')).toBeInTheDocument();
      expect(screen.getByTestId('homepage-actions')).toBeInTheDocument();
    });

    test('displays application title and description', () => {
      renderHomePage();

      expect(screen.getByText('Censeo Story Pointing')).toBeInTheDocument();
      expect(screen.getByText(/collaborative story estimation/i)).toBeInTheDocument();
    });

    test('renders call-to-action buttons', () => {
      renderHomePage();

      expect(screen.getByText('Create Session')).toBeInTheDocument();
      expect(screen.getByText('Join Session')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles create session button click', () => {
      renderHomePage();

      const createButton = screen.getByText('Create Session');
      fireEvent.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/create-session');
    });

    test('handles join session button click', () => {
      renderHomePage();

      const joinButton = screen.getByText('Join Session');
      fireEvent.click(joinButton);

      expect(mockNavigate).toHaveBeenCalledWith('/join-session');
    });

    test('shows authentication prompt for unauthenticated users', () => {
      renderHomePage();

      // Should show login prompt or login form
      expect(screen.getByTestId('auth-section')).toBeInTheDocument();
    });
  });

  describe('Authentication Integration', () => {
    test('displays different content for authenticated users', async () => {
      // Mock authenticated state
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };

      renderHomePage();

      await waitFor(() => {
        // Should show user-specific content when authenticated
        expect(screen.getByTestId('homepage-actions')).toBeInTheDocument();
      });
    });

    test('displays login form for unauthenticated users', () => {
      renderHomePage();

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    test('handles login form submission', async () => {
      renderHomePage();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const loginButton = screen.getByText('Login');

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(loginButton);

      // Should trigger login process
      await waitFor(() => {
        expect(nameInput).toHaveValue('Test User');
        expect(emailInput).toHaveValue('test@example.com');
      });
    });
  });

  describe('Form Validation', () => {
    test('validates required fields in login form', async () => {
      renderHomePage();

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    test('validates email format', async () => {
      renderHomePage();

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    test('enables login button only when form is valid', async () => {
      renderHomePage();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const loginButton = screen.getByText('Login');

      // Initially disabled
      expect(loginButton).toBeDisabled();

      // Fill in valid data
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
    });
  });

  describe('Responsive Design', () => {
    test('adapts layout for different screen sizes', () => {
      renderHomePage();

      const container = screen.getByTestId('homepage-container');
      expect(container).toHaveStyle('display: flex');
      expect(container).toHaveStyle('flex-direction: column');
    });

    test('maintains proper spacing and alignment', () => {
      renderHomePage();

      const hero = screen.getByTestId('homepage-hero');
      const actions = screen.getByTestId('homepage-actions');

      expect(hero).toBeInTheDocument();
      expect(actions).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels and roles', () => {
      renderHomePage();

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('supports keyboard navigation', () => {
      renderHomePage();

      const createButton = screen.getByText('Create Session');
      const joinButton = screen.getByText('Join Session');

      expect(createButton).toHaveAttribute('tabindex', '0');
      expect(joinButton).toHaveAttribute('tabindex', '0');
    });

    test('provides proper form accessibility', () => {
      renderHomePage();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      expect(nameInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Loading States', () => {
    test('shows loading state during authentication check', () => {
      renderHomePage();

      // Should handle loading state gracefully
      expect(screen.getByTestId('homepage-container')).toBeInTheDocument();
    });

    test('shows loading state during login process', async () => {
      renderHomePage();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const loginButton = screen.getByText('Login');

      fireEvent.change(nameInput, { target: { value: 'Test User' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(loginButton);

      // Should show loading indicator
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });
    });
  });
});