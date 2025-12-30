"use strict";
/**
 * Machine Service Handler
 * Exposes machine module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineServiceHandler = void 0;
// ==================== SERVICE HANDLER ====================
class MachineServiceHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        const { method, path } = request;
        // Route: GET /machines/:id
        if (method === 'GET' && /^\/machines\/[\w-]+$/.exec(path)) {
            const machineId = path.split('/')[2];
            return this.getMachineById(machineId);
        }
        // Route: GET /machines
        if (method === 'GET' && path === '/machines') {
            return this.getAllMachines();
        }
        // Route: GET /machines/active
        if (method === 'GET' && path === '/machines/active') {
            return this.getActiveMachines();
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getMachineById(machineId) {
        try {
            const machine = await this.repository.findById(machineId);
            if (!machine) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Machine not found' }
                };
            }
            return {
                success: true,
                data: this.toSummary(machine)
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getAllMachines() {
        try {
            const machines = await this.repository.findAll();
            return {
                success: true,
                data: machines.map((m) => this.toSummary(m))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getActiveMachines() {
        try {
            const machines = await this.repository.findAll({ isActive: true });
            return {
                success: true,
                data: machines.map((m) => this.toSummary(m))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    toSummary(machine) {
        return {
            id: machine.id,
            name: machine.name,
            code: machine.code,
            machineType: machine.machineType,
            isActive: machine.isActive,
            kerf: machine.kerf
        };
    }
}
exports.MachineServiceHandler = MachineServiceHandler;
//# sourceMappingURL=machine.service-handler.js.map