/**
 * Material Controller
 * Following Single Responsibility Principle (SRP): Only handles HTTP concerns
 * Controller Layer - Thin controller, delegates to service
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IMaterialService } from '../../core/interfaces';

export class MaterialController {
    public router: Router;

    constructor(private readonly materialService: IMaterialService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', this.getById.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.delete.bind(this));
        this.router.post('/:id/thicknesses', this.addThickness.bind(this));
    }

    private async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.getMaterials();

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.getMaterialById(req.params.id);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.createMaterial(req.body);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.updateMaterial(req.params.id, req.body);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.deleteMaterial(req.params.id);

            if (result.success) {
                res.json({ success: true, message: 'Malzeme silindi' });
            } else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async addThickness(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.materialService.addThicknessRange(req.params.id, req.body);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'MATERIAL_NOT_FOUND' ? 404 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

/**
 * Factory function to create material controller with dependencies
 */
export function createMaterialController(materialService: IMaterialService): MaterialController {
    return new MaterialController(materialService);
}
