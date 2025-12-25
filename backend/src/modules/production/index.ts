/**
 * Production Module - Barrel Export
 */

export { ProductionRepository, IProductionRepository } from './production.repository';
export { ProductionService } from './production.service';
export { ProductionController, createProductionController } from './production.controller';

// Mapper
export * from './production.mapper';

// Specialized Services
export { ProductionDowntimeService, IProductionDowntimeService } from './production-downtime.service';
export { ProductionQualityService, IProductionQualityService } from './production-quality.service';

// Microservice
export { ProductionEventHandler } from './production.event-handler';
