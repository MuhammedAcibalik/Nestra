/**
 * Integration Test Setup
 * Initializes test environment with real database connections
 */

import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Increase timeout for integration tests
jest.setTimeout(30000);

// Cleanup after all tests
afterAll(async () => {
    // Close database connections, cleanup resources
    // Add cleanup logic here as needed
});

// Global error handler for unhandled rejections in tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
