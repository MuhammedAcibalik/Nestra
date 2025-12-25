/**
 * Health Controller
 * Provides liveness and readiness probes for Kubernetes/Docker
 * Following Microservice Pattern: Health Checks
 * @openapi
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy, degraded]
 *         timestamp:
 *           type: string
 *           format: date-time
 *         version:
 *           type: string
 *         uptime:
 *           type: integer
 *           description: Uptime in seconds
 *         checks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HealthCheck'
 *     HealthCheck:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           enum: [database, rabbitmq, memory]
 *         status:
 *           type: string
 *           enum: [pass, fail, warn]
 *         latency:
 *           type: integer
 *           description: Latency in milliseconds
 *         message:
 *           type: string
 */
import { Router } from 'express';
export interface IHealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    uptime: number;
    checks: IHealthCheck[];
}
export interface IHealthCheck {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    latency?: number;
    message?: string;
}
export declare class HealthController {
    readonly router: Router;
    private readonly startTime;
    private readonly version;
    constructor();
    private setupRoutes;
    /**
     * @openapi
     * /health:
     *   get:
     *     tags: [Health]
     *     summary: Liveness probe
     *     description: Servisin çalışıp çalışmadığını kontrol eder
     *     responses:
     *       200:
     *         description: Servis çalışıyor
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: ok
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     */
    private getLiveness;
    /**
     * @openapi
     * /health/ready:
     *   get:
     *     tags: [Health]
     *     summary: Readiness probe
     *     description: Servisin trafik almaya hazır olup olmadığını kontrol eder
     *     responses:
     *       200:
     *         description: Servis hazır
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: ready
     *                 timestamp:
     *                   type: string
     *                   format: date-time
     *       503:
     *         description: Servis hazır değil
     */
    private getReadiness;
    /**
     * @openapi
     * /health/detailed:
     *   get:
     *     tags: [Health]
     *     summary: Detaylı sağlık durumu
     *     description: Database, RabbitMQ ve memory durumunu içeren detaylı sağlık raporu
     *     responses:
     *       200:
     *         description: Sağlık durumu (healthy veya degraded)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthStatus'
     *       503:
     *         description: Servis sağlıksız
     */
    private getDetailedHealth;
}
export declare function getHealthController(): HealthController;
//# sourceMappingURL=health.controller.d.ts.map