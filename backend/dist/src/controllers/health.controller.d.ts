/**
 * Health Controller
 * Provides liveness and readiness probes for Kubernetes/Docker
 * Following Microservice Pattern: Health Checks
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
    private getLiveness;
    private getReadiness;
    private getDetailedHealth;
}
export declare function getHealthController(): HealthController;
//# sourceMappingURL=health.controller.d.ts.map