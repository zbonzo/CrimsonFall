module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: [
    "**/tests/**/*.test.{js,jsx,ts,tsx}",
    "!**/tests/**/simulations/**/*"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/", 
    "/simulations/"
  ],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/client/(.*)$": "<rootDir>/client/src/$1",
    "^@/server/(.*)$": "<rootDir>/server/src/$1",
    "^@/shared/(.*)$": "<rootDir>/shared/src/$1",
    "^@/tests/(.*)$": "<rootDir>/tests/$1"
  },
  collectCoverage: true,
  coverageDirectory: "tests/coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "client/src/**/*.{js,jsx,ts,tsx}",
    "server/src/**/*.{js,jsx,ts,tsx}",
    "shared/src/**/*.{js,jsx,ts,tsx}",
    "!**/*.test.{js,jsx,ts,tsx}",
    "!**/tests/**/*",
    "!**/simulations/**/*",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/dist/**"
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 10000,
  maxWorkers: "50%",
  clearMocks: true,
  restoreMocks: true,
  verbose: true
};
