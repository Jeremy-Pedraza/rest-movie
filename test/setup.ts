/**
 * Jest Setup for Unit Tests
 */

import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock console for silent tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Global timeout
jest.setTimeout(30000);

// Clear mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
