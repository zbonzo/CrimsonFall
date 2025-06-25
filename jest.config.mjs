export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Handle .js imports from @ paths to .ts files (MUST BE FIRST)
    '^@/(.*)\\.js$': '<rootDir>/server/src/$1',
    
    // Handle TypeScript path mapping
    '^@/(.*)$': '<rootDir>/server/src/$1',
    '^@/client/(.*)$': '<rootDir>/client/src/$1',
    '^@/server/(.*)$': '<rootDir>/server/src/$1',
    '^@/shared/(.*)$': '<rootDir>/shared/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^@/utils/(.*)$': '<rootDir>/server/src/utils/$1',
    '^@/core/(.*)$': '<rootDir>/server/src/core/$1',

    // Handle .js imports in TypeScript files (ESM requirement)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tests/tsconfig.json',
        injectGlobals: true,
      },
    ],
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/server/src/**/*.test.ts',
    '<rootDir>/client/src/**/*.test.ts',
  ],
  collectCoverageFrom: [
    'server/src/**/*.ts',
    'client/src/**/*.ts',
    '!**/*.test.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
};
