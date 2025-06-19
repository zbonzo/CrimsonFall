export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.ts$': '$1',
    '^@/(.*)$': '<rootDir>/server/src/$1',
    '^@/client/(.*)$': '<rootDir>/client/src/$1',
    '^@/server/(.*)$': '<rootDir>/server/src/$1',
    '^@/core/(.*)$': '<rootDir>/server/src/core$1',
    '^@/utils/(.*)$': '<rootDir>/server/src/utils/$1',
    '^@/shared/(.*)$': '<rootDir>/shared/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
  },
  // Update this section
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
};
