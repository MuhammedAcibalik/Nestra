/**
 * Jest Integration Tests Configuration
 * For tests that require database and external services
 */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: [
        '**/*.integration.spec.ts',
        '**/*.integration.test.ts'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@test/(.*)$': '<rootDir>/test/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/test/setup.integration.ts'],
    testTimeout: 30000,
    maxWorkers: 1, // Run integration tests sequentially
    verbose: true,
    collectCoverage: false,
    forceExit: true,
    detectOpenHandles: true,
    // Environment variables for integration tests
    testEnvironmentOptions: {
        NODE_ENV: 'test'
    }
};
