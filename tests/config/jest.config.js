/**
 * @fileoverview Jest configuration for Crimsonfall hex dungeon crawler
 * Configured for TypeScript, ES modules, and comprehensive testing strategy
 *
 * @file tests/config/jest.config.js
 */

export default {
  // Test environment
  testEnvironment: 'node',
  
  // TypeScript and ES modules support
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../server/src/$1',
    '^@/core/(.*)$': '<rootDir>/../server/src/core/$1',
    '^@/systems/(.*)$': '<rootDir>/../server/src/core/systems/$1',
    '^@/entities/(.*)$': '<rootDir>/../server/src/core/entities/$1',
    '^@/utils/(.*)$': '<rootDir>/../server/src/utils/$1',
    '^@/tests/(.*)$': '<rootDir>/$1'
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/unit/**/*.test.ts',
    '<rootDir>/integration/**/*.test.ts',
    '<rootDir>/e2e/**/*.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/setup.ts'
  ],
  
  // TypeScript transformation
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/../server/src/**/*.ts',
    '!<rootDir>/../server/src/**/*.d.ts',
    '!<rootDir>/../server/src/**/*.test.ts',
    '!<rootDir>/../server/src/**/debug/**',
    '!<rootDir>/../server/src/**/index.ts', // Entry points usually just re-export
    '!<rootDir>/../server/src/config/**/*.json'
  ],
  
  // Coverage thresholds (enforced by CI)
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    // Stricter requirements for critical systems
    '<rootDir>/../server/src/utils/hex/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    '<rootDir>/../server/src/core/entities/': {
      branches: 92,
      functions: 92,
      lines: 92,
      statements: 92
    },
    '<rootDir>/../server/src/core/systems/': {
      branches: 92,
      functions: 92,
      lines: 92,
      statements: 92
    }
  },
  
  // Coverage reporting
  coverageDirectory: '<rootDir>/../coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Test execution settings
  testTimeout: 10000, // 10 seconds for integration tests
  maxWorkers: '50%', // Use half available CPU cores
  
  // Clear mocks automatically
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance and memory
  logHeapUsage: true,
  detectOpenHandles: true,
  detectLeaks: true,
  
  // Test categorization with custom reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/../test-results',
      outputName: 'junit.xml',
      suiteName: 'Crimsonfall Tests',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true
    }],
    ['jest-html-reporters', {
      publicPath: '<rootDir>/../test-results',
      filename: 'test-report.html',
      pageTitle: 'Crimsonfall Test Report',
      logoImgPath: undefined,
      hideIcon: false,
      enableMergeData: true,
      dateMerge: true,
      inlineSource: true
    }]
  ],
  
  // Custom test environments for different test types
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/unit/**/*.test.ts'],
      testTimeout: 5000,
      setupFilesAfterEnv: ['<rootDir>/setup.ts']
    },
    {
      displayName: 'Integration Tests', 
      testMatch: ['<rootDir>/integration/**/*.test.ts'],
      testTimeout: 15000,
      setupFilesAfterEnv: ['<rootDir>/setup.ts']
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/e2e/**/*.test.ts'],
      testTimeout: 30000,
      setupFilesAfterEnv: ['<rootDir>/setup.ts']
    }
  ],
  
  // Global variables for tests
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '<rootDir>/../coverage/'
  ],
  
  // Watch mode settings (for development)
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '<rootDir>/../coverage/'
  ],
  
  // Custom matchers and utilities
  setupFiles: [],
  
  // Snapshot serializers
  snapshotSerializers: [],
  
  // Mock settings
  mockPathIgnorePatterns: ['/node_modules/'],
  
  // Cache settings
  cacheDirectory: '<rootDir>/../.jest-cache'
};