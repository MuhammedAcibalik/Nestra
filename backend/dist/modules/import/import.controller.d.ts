/**
 * Import Controller
 * Handles file upload and import endpoints
 */
import { Router } from 'express';
import { IImportService } from './import.service';
export declare class ImportController {
    private readonly service;
    readonly router: Router;
    constructor(service: IImportService);
    private initializeRoutes;
    private importOrders;
    private getHeaders;
    private suggestMapping;
}
//# sourceMappingURL=import.controller.d.ts.map