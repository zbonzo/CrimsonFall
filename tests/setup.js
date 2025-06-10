/**
 * Jest Test Setup
 * Global test configuration and utilities
 * 
 * @file tests/setup.js
 */

// === GLOBAL TEST UTILITIES ===

// Performance testing utilities
global.performance = global.performance || {
  now: () => Date.now()
};

// Mock console for cleaner test output
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  // Suppress console.log in tests unless explicitly testing it
  log: jest.fn(),
  // Keep error and warn for debugging
  error: originalConsole.error,
  warn: originalConsole.warn,
  info: originalConsole.info
};

// === TEST HELPERS ===

/**
 * Create a test hex coordinate with validation
 */
global.createTestHex = (q, r) => {
  const s = -q - r;
  return { q, r, s };
};

/**
 * Assert that two hex coordinates are equal
 */
global.expectHexEqual = (actual, expected) => {
  expect(actual.q).toBe(expected.q);
  expect(actual.r).toBe(expected.r);
  expect(actual.s).toBe(expected.s);
};

/**
 * Create a set of hex coordinate strings for obstacle testing
 */
global.createObstacleSet = (...coordinates) => {
  return new Set(coordinates.map(([q, r]) => `${q},${r}`));
};

// === MOCK IMPLEMENTATIONS ===

// Mock any external dependencies that aren't available in test environment
// (None needed for hex math utilities, but placeholder for future)

// === TEST TIMEOUT CONFIGURATION ===

// Set default timeout for async operations
jest.setTimeout(5000);

// === CLEANUP ===

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset console mocks if they were used
  if (global.console.log.mockClear) {
    global.console.log.mockClear();
  }
});

// === ERROR HANDLING ===

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test if there are unhandled rejections
  throw reason;
});