export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Update this section
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
  ],
};