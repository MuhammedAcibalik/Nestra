/**
 * Machine Module - Barrel Export
 * Following standard module structure
 */

// ==================== INTERFACES ====================
export * from './interfaces';

// ==================== REPOSITORY ====================
export { MachineRepository } from './machine.repository';

// ==================== SERVICE ====================
export { MachineService } from './machine.service';

// ==================== CONTROLLER ====================
export { MachineController } from './machine.controller';

// ==================== MICROSERVICE ====================
export { MachineServiceHandler } from './machine.service-handler';
export { MachineEventHandler } from './machine.event-handler';
