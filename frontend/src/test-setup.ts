/**
 * Test setup configuration for React Testing Library and Jest
 * This file is imported automatically by Jest before running tests
 */

import "@testing-library/jest-dom";

// Mock window.matchMedia for Material-UI components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver for Material-UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Setup fetch mock for API testing
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

beforeEach(() => {
  jest.clearAllMocks();
});
