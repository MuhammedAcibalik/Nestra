/**
 * Machine Controller
 * Following SRP - Only handles HTTP request/response
 */

import { Router, Request, Response } from 'express';
import { IMachineService } from './machine.service';
import { MachineType } from './machine.repository';

export class MachineController {
    public readonly router: Router;

    constructor(private readonly machineService: IMachineService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // GET /api/machines - Get all machines
        this.router.get('/', this.getMachines.bind(this));

        // GET /api/machines/compatible - Get compatible machines for material
        this.router.get('/compatible', this.getCompatibleMachines.bind(this));

        // GET /api/machines/:id - Get machine by ID
        this.router.get('/:id', this.getMachineById.bind(this));

        // POST /api/machines - Create new machine
        this.router.post('/', this.createMachine.bind(this));

        // PUT /api/machines/:id - Update machine
        this.router.put('/:id', this.updateMachine.bind(this));

        // DELETE /api/machines/:id - Delete machine
        this.router.delete('/:id', this.deleteMachine.bind(this));

        // POST /api/machines/:id/compatibility - Add compatibility
        this.router.post('/:id/compatibility', this.addCompatibility.bind(this));

        // DELETE /api/machines/:id/compatibility/:compatibilityId - Remove compatibility
        this.router.delete('/:id/compatibility/:compatibilityId', this.removeCompatibility.bind(this));
    }

    private async getMachines(req: Request, res: Response): Promise<void> {
        let isActive: boolean | undefined;
        if (req.query.isActive === 'true') {
            isActive = true;
        } else if (req.query.isActive === 'false') {
            isActive = false;
        }

        const filter = {
            machineType: req.query.machineType as MachineType | undefined,
            isActive,
            locationId: req.query.locationId as string | undefined
        };

        const result = await this.machineService.getMachines(filter);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    }

    private async getMachineById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.machineService.getMachineById(id);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'MACHINE_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async createMachine(req: Request, res: Response): Promise<void> {
        const result = await this.machineService.createMachine(req.body);

        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'DUPLICATE_CODE' ? 409 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async updateMachine(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.machineService.updateMachine(id, req.body);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'MACHINE_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async deleteMachine(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.machineService.deleteMachine(id);

        if (result.success) {
            res.status(204).send();
        } else {
            const status = result.error?.code === 'MACHINE_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async addCompatibility(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.machineService.addCompatibility(id, req.body);

        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'MACHINE_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async removeCompatibility(req: Request, res: Response): Promise<void> {
        const { compatibilityId } = req.params;
        const result = await this.machineService.removeCompatibility(compatibilityId);

        if (result.success) {
            res.status(204).send();
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    }

    private async getCompatibleMachines(req: Request, res: Response): Promise<void> {
        const { materialTypeId, thickness } = req.query;

        if (!materialTypeId || !thickness) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'materialTypeId ve thickness parametreleri zorunludur'
                }
            });
            return;
        }

        const result = await this.machineService.getCompatibleMachines(
            materialTypeId as string,
            Number.parseFloat(thickness as string)
        );

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    }
}
