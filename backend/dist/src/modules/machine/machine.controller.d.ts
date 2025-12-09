/**
 * Machine Controller
 * Following SRP - Only handles HTTP request/response
 */
import { Router } from 'express';
import { IMachineService } from './machine.service';
export declare class MachineController {
    private readonly machineService;
    readonly router: Router;
    constructor(machineService: IMachineService);
    private initializeRoutes;
    private getMachines;
    private getMachineById;
    private createMachine;
    private updateMachine;
    private deleteMachine;
    private addCompatibility;
    private removeCompatibility;
    private getCompatibleMachines;
}
//# sourceMappingURL=machine.controller.d.ts.map