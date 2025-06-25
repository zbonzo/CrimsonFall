/**
 * Jest test setup file
 * Sets up global test configuration, custom matchers, and mock management
 * @file tests/setup.ts
 */

// Import Jest to make it available
import { jest } from '@jest/globals';

// Import custom matchers
import './helpers/assertions.js';

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

// Performance testing helper
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  getEntries: jest.fn(() => [])
};

// Test environment setup
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset performance.now for consistent timing in tests
  if (jest.isMockFunction(global.performance.now)) {
    let currentTime = 0;
    global.performance.now.mockImplementation(() => {
      currentTime += 1; // Each call advances time by 1ms
      return currentTime;
    });
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection in test:', error);
  throw error;
});
