/**
 * Material Service Handler
 * Exposes material module as internal service
 * Following ISP - only exposes operations needed by other modules
 */

import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { IMaterialRepository, MaterialTypeWithRelations } from './material.repository';

// ==================== INTERFACES ====================

export interface IMaterialTypeSummary {
    id: string;
    name: string;
    description: string | null;
    isRotatable: boolean;
}

// ==================== SERVICE HANDLER ====================

export class MaterialServiceHandler implements IServiceHandler {
    constructor(private readonly repository: IMaterialRepository) {}

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path } = request;

        // Route: GET /materials/:id
        if (method === 'GET' && /^\/materials\/[\w-]+$/.exec(path)) {
            const materialId = path.split('/')[2];
            return this.getMaterialById(materialId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /materials
        if (method === 'GET' && path === '/materials') {
            return this.getAllMaterials() as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /materials/by-name/:name
        if (method === 'GET' && /^\/materials\/by-name\/[\w-]+$/.exec(path)) {
            const name = decodeURIComponent(path.split('/')[3]);
            return this.getMaterialByName(name) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getMaterialById(materialId: string): Promise<IServiceResponse<IMaterialTypeSummary>> {
        try {
            const material = await this.repository.findById(materialId);

            if (!material) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Material not found' }
                };
            }

            return {
                success: true,
                data: this.toSummary(material)
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

    private async getAllMaterials(): Promise<IServiceResponse<IMaterialTypeSummary[]>> {
        try {
            const materials = await this.repository.findAll();

            return {
                success: true,
                data: materials.map((m) => this.toSummary(m))
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

    private async getMaterialByName(name: string): Promise<IServiceResponse<IMaterialTypeSummary>> {
        try {
            const material = await this.repository.findByName(name);

            if (!material) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Material not found' }
                };
            }

            return {
                success: true,
                data: {
                    id: material.id,
                    name: material.name,
                    description: material.description,
                    isRotatable: material.isRotatable
                }
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

    private toSummary(material: MaterialTypeWithRelations): IMaterialTypeSummary {
        return {
            id: material.id,
            name: material.name,
            description: material.description,
            isRotatable: material.isRotatable
        };
    }
}
