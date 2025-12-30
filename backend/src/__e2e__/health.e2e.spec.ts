/**
 * Health Endpoint E2E Tests
 * Tests the health check API endpoints
 */

import request from 'supertest';
import { createTestApp } from './setup';
import type { Express } from 'express';

describe('Health Endpoints (E2E)', () => {
    let app: Express;

    beforeAll(() => {
        app = createTestApp();
    });

    describe('GET /health', () => {
        it('should return 200 with health status', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('should return valid ISO timestamp', async () => {
            const response = await request(app).get('/health');

            const timestamp = new Date(response.body.timestamp);
            expect(timestamp.toISOString()).toBe(response.body.timestamp);
        });
    });

    describe('Unknown Routes', () => {
        it('should return 404 for unknown routes', async () => {
            const response = await request(app).get('/unknown-route');

            expect(response.status).toBe(404);
        });
    });
});
