"use strict";
/**
 * Material Service Handler
 * Exposes material module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialServiceHandler = void 0;
// ==================== SERVICE HANDLER ====================
class MaterialServiceHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        const { method, path } = request;
        // Route: GET /materials/:id
        if (method === 'GET' && /^\/materials\/[\w-]+$/.exec(path)) {
            const materialId = path.split('/')[2];
            return this.getMaterialById(materialId);
        }
        // Route: GET /materials
        if (method === 'GET' && path === '/materials') {
            return this.getAllMaterials();
        }
        // Route: GET /materials/by-name/:name
        if (method === 'GET' && /^\/materials\/by-name\/[\w-]+$/.exec(path)) {
            const name = decodeURIComponent(path.split('/')[3]);
            return this.getMaterialByName(name);
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getMaterialById(materialId) {
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
    async getAllMaterials() {
        try {
            const materials = await this.repository.findAll();
            return {
                success: true,
                data: materials.map(m => this.toSummary(m))
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
    async getMaterialByName(name) {
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
    toSummary(material) {
        return {
            id: material.id,
            name: material.name,
            description: material.description,
            isRotatable: material.isRotatable
        };
    }
}
exports.MaterialServiceHandler = MaterialServiceHandler;
//# sourceMappingURL=material.service-handler.js.map