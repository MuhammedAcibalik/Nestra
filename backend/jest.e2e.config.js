/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    displayName: 'E2E Tests',

    // Root configuration - only e2e tests
    roots: ['<rootDir>/src'],
    testMatch: ['**/__e2e__/**/*.spec.ts', '**/*.e2e.spec.ts'],

    // Transform
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.spec.json'
        }]
    },

    // Setup
    setupFilesAfterEnv: ['<rootDir>/src/__e2e__/setup.ts'],

    // Module aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^src/(.*)$': '<rootDir>/src/$1'
    },

    // Longer timeouts for E2E
    testTimeout: 30000,

    // Run serially for E2E (database state)
    maxWorkers: 1,

    // Verbose output
    verbose: true
};
