// Global setup for all tests
// This runs before each test file

// Example: Global mocks or polyfills
globalThis.console = {
    ...console,
    // error: jest.fn(), // Uncomment to silence errors during tests
    // warn: jest.fn(),
};

// Reset mocks between tests if needed (though jest.config.js handles this mostly)
beforeEach(() => {
    // Check if we need to reset any global singletons here
});
