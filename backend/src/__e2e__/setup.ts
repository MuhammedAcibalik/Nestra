/**
 * E2E Test Setup
 * Configures Express app instance for integration testing with Supertest
 * 
 * Following testing best practices:
 * - Isolated test database
 * - Clean state between tests
 * - Proper cleanup
 */

import express, { Express } from 'express';
import { Server } from 'http';

// ==================== APP FACTORY ====================

/**
 * Create a minimal Express app for E2E testing
 * This bypasses full bootstrap for faster tests
 */
export function createTestApp(): Express {
    const app = express();

    // Essential middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check for testing
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    return app;
}

// ==================== SERVER MANAGEMENT ====================

let testServer: Server | null = null;

/**
 * Start test server on random port
 */
export async function startTestServer(app: Express): Promise<{ server: Server; port: number }> {
    return new Promise((resolve) => {
        const server = app.listen(0, () => {
            const address = server.address();
            const port = typeof address === 'object' && address ? address.port : 0;
            testServer = server;
            resolve({ server, port });
        });
    });
}

/**
 * Stop test server
 */
export async function stopTestServer(): Promise<void> {
    if (testServer) {
        await new Promise<void>((resolve, reject) => {
            testServer?.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        testServer = null;
    }
}

// ==================== TEST CONTEXT ====================

export interface ITestContext {
    app: Express;
    baseUrl: string;
}

/**
 * Create test context with app and base URL
 */
export async function createTestContext(): Promise<ITestContext> {
    const app = createTestApp();
    const { port } = await startTestServer(app);

    return {
        app,
        baseUrl: `http://localhost:${port}`
    };
}

// ==================== JEST HOOKS ====================

// Global cleanup after all tests
afterAll(async () => {
    await stopTestServer();
});
