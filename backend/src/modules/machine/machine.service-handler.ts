/**
 * Machine Service Handler
 * Exposes machine module as internal service
 * Following ISP - only exposes operations needed by other modules
 */

import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { IMachineRepository, MachineWithRelations } from './machine.repository';

// ==================== INTERFACES ====================

export interface IMachineSummary {
    id: string;
    name: string;
    code: string;
    machineType: string;
    isActive: boolean;
    kerf?: number | null;
}

// ==================== SERVICE HANDLER ====================

export class MachineServiceHandler implements IServiceHandler {
    constructor(private readonly repository: IMachineRepository) {}

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path } = request;

        // Route: GET /machines/:id
        if (method === 'GET' && /^\/machines\/[\w-]+$/.exec(path)) {
            const machineId = path.split('/')[2];
            return this.getMachineById(machineId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /machines
        if (method === 'GET' && path === '/machines') {
            return this.getAllMachines() as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /machines/active
        if (method === 'GET' && path === '/machines/active') {
            return this.getActiveMachines() as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getMachineById(machineId: string): Promise<IServiceResponse<IMachineSummary>> {
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
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getAllMachines(): Promise<IServiceResponse<IMachineSummary[]>> {
        try {
            const machines = await this.repository.findAll();

            return {
                success: true,
                data: machines.map((m) => this.toSummary(m))
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getActiveMachines(): Promise<IServiceResponse<IMachineSummary[]>> {
        try {
            const machines = await this.repository.findAll({ isActive: true });

            return {
                success: true,
                data: machines.map((m) => this.toSummary(m))
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private toSummary(machine: MachineWithRelations): IMachineSummary {
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
