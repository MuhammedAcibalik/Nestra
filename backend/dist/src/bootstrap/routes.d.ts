/**
 * Express Routes Configuration
 * Following Single Responsibility Principle (SRP)
 * Responsible for route registration only
 */
import { Express } from 'express';
import { Database } from '../db';
import { IAppServices } from './di-container';
/**
 * Initialize all routes with dependency injection
 */
export declare function initializeRoutes(app: Express, services: IAppServices, db: Database): void;
/**
 * Initialize error handling middleware
 * Must be called after all routes are registered
 */
export declare function initializeErrorHandling(app: Express): void;
//# sourceMappingURL=routes.d.ts.map