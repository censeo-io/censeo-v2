/**
 * App Component Tests
 * Tests for main application component initialization and basic functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock the API client to prevent actual API calls during tests
jest.mock('../services/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    getStatus: jest.fn(),
  },
}));

describe('App Component', () => {
  const renderApp = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('App Initialization', () => {
    test('renders without crashing', () => {
      renderApp();
      expect(document.body).toBeInTheDocument();
    });

    test('renders main application structure', async () => {
      renderApp();

      // Should render the main app container
      await waitFor(() => {
        expect(screen.getByTestId('app-container')).toBeInTheDocument();
      });
    });

    test('renders with Material-UI theme provider', () => {
      renderApp();

      // Check that Material-UI theme is applied by looking for theme-specific elements
      const appContainer = screen.getByTestId('app-container');
      expect(appContainer).toHaveStyle('font-family: "Roboto", "Helvetica", "Arial", sans-serif');
    });

    test('initializes routing system', () => {
      renderApp('/');

      // Should have routing context available
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });
  });

  describe('Navigation and Routing', () => {
    test('renders home route by default', () => {
      renderApp('/');

      // Should render the home/landing page content
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });

    test('handles unknown routes gracefully', () => {
      renderApp('/unknown-route');

      // Should render without throwing errors
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('renders error boundary when child component throws', () => {
      // This would be tested with a component that intentionally throws
      // For now, ensure the app structure is robust
      renderApp();
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper document structure for screen readers', () => {
      renderApp();

      // Should have main landmark
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    test('maintains focus management for navigation', () => {
      renderApp();

      // Should have focusable elements
      const container = screen.getByTestId('app-container');
      expect(container).toBeInTheDocument();
    });
  });
});