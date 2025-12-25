/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    // Root configuration
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.+(ts|tsx)', '**/?(*.)+(spec|test).+(ts|tsx)'],

    // Strict transformations with dedicated spec config
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: 'tsconfig.spec.json',
            diagnostics: {
                warnOnly: false
            }
        }]
    },

    // Transform ESM modules from node_modules
    transformIgnorePatterns: [
        'node_modules/(?!(xlsx|uuid)/)'
    ],

    // Global Test Setup
    setupFilesAfterEnv: ['<rootDir>/test/jest-setup.ts'],

    // Module Path Aliases (Must match tsconfig)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^src/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@test/(.*)$': '<rootDir>/test/$1',
        '^uuid$': '<rootDir>/test/__mocks__/uuid.ts'
    },

    // Coverage Configuration
    collectCoverage: false, // Default to false for speed, enabled via flag
    collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.dto.ts',
        '!src/**/__tests__/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },

    // Performance & Cleanup
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    workerIdleMemoryLimit: '512MB',
    verbose: true
};
