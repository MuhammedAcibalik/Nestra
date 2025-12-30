/**
 * Location Module - Barrel Export
 * Following standard module structure
 */

// ==================== INTERFACES ====================
export * from './interfaces';

// ==================== REPOSITORY ====================
export { LocationRepository } from './location.repository';

// ==================== SERVICE ====================
export { LocationService } from './location.service';

// ==================== CONTROLLER ====================
export { LocationController } from './location.controller';

// ==================== MICROSERVICE ====================
export { LocationServiceHandler } from './location.service-handler';
