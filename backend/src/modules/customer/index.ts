/**
 * Customer Module - Barrel Export
 * Following standard module structure
 */

// ==================== INTERFACES ====================
export * from './interfaces';

// ==================== REPOSITORY ====================
export { CustomerRepository } from './customer.repository';

// ==================== SERVICE ====================
export { CustomerService } from './customer.service';

// ==================== CONTROLLER ====================
export { CustomerController } from './customer.controller';

// ==================== MICROSERVICE ====================
export { CustomerServiceHandler } from './customer.service-handler';
