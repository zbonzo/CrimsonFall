/**
 * Jest test setup file
 * @file tests/setup.ts
 */

// Import Jest to make it available
import { jest } from '@jest/globals';

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Setup global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidHexCoordinate(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidHexCoordinate(received) {
    const pass = Math.abs(received.q + received.r + received.s) < Number.EPSILON;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid hex coordinate`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to be a valid hex coordinate (q + r + s = 0)`,
        pass: false,
      };
    }
  },
});

// Test environment setup
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
