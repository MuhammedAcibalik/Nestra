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

import { Router, Request, Response } from 'express';
import { getDb } from '../db';

// ==================== INTERFACES ====================

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

// ==================== HEALTH CHECK FUNCTIONS ====================

async function checkDatabase(): Promise<IHealthCheck> {
    const start = Date.now();
    try {
        const db = getDb();
        // Simple query to check connection
        await db.execute(new (await import('drizzle-orm')).SQL(['SELECT 1']));
        return {
            name: 'database',
            status: 'pass',
            latency: Date.now() - start
        };
    } catch (error) {
        return {
            name: 'database',
            status: 'fail',
            latency: Date.now() - start,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function checkRabbitMQ(): Promise<IHealthCheck> {
    try {
        const { getMessageBus } = await import('../core/messaging');
        const bus = getMessageBus();
        const isConnected = bus.isConnected();
        return {
            name: 'rabbitmq',
            status: isConnected ? 'pass' : 'warn',
            message: isConnected ? 'Connected' : 'Not connected (using in-memory)'
        };
    } catch {
        return {
            name: 'rabbitmq',
            status: 'warn',
            message: 'RabbitMQ not configured'
        };
    }
}

function checkMemory(): IHealthCheck {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const percentage = Math.round((used.heapUsed / used.heapTotal) * 100);

    let status: 'pass' | 'fail' | 'warn' = 'pass';
    if (percentage > 90) status = 'fail';
    else if (percentage > 75) status = 'warn';

    return {
        name: 'memory',
        status,
        message: `${heapUsedMB}MB / ${heapTotalMB}MB (${percentage}%)`
    };
}

// ==================== CONTROLLER ====================

export class HealthController {
    public readonly router: Router;
    private readonly startTime: number;
    private readonly version: string;

    constructor() {
        this.router = Router();
        this.startTime = Date.now();
        this.version = process.env.npm_package_version ?? '1.0.0';
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.get('/health', this.getLiveness.bind(this));
        this.router.get('/health/live', this.getLiveness.bind(this));
        this.router.get('/health/ready', this.getReadiness.bind(this));
        this.router.get('/health/detailed', this.getDetailedHealth.bind(this));
    }

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
    private getLiveness(_req: Request, res: Response): void {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    }

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
    private async getReadiness(_req: Request, res: Response): Promise<void> {
        try {
            const dbCheck = await checkDatabase();

            if (dbCheck.status === 'fail') {
                res.status(503).json({
                    status: 'not_ready',
                    reason: 'Database unavailable',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(503).json({
                status: 'not_ready',
                reason: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }

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
    private async getDetailedHealth(_req: Request, res: Response): Promise<void> {
        try {
            const checks = await Promise.all([
                checkDatabase(),
                checkRabbitMQ(),
                Promise.resolve(checkMemory())
            ]);

            const hasFailure = checks.some(c => c.status === 'fail');
            const hasWarning = checks.some(c => c.status === 'warn');

            let overallStatus: IHealthStatus['status'] = 'healthy';
            if (hasFailure) overallStatus = 'unhealthy';
            else if (hasWarning) overallStatus = 'degraded';

            const health: IHealthStatus = {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                version: this.version,
                uptime: Math.round((Date.now() - this.startTime) / 1000),
                checks
            };

            const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
            res.status(statusCode).json(health);
        } catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}

// ==================== SINGLETON INSTANCE ====================

let healthControllerInstance: HealthController | null = null;

export function getHealthController(): HealthController {
    healthControllerInstance ??= new HealthController();
    return healthControllerInstance;
}
