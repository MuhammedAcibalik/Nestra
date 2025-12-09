/**
 * Stock Controller
 * Following SRP - Only handles HTTP concerns
 */
import { Router } from 'express';
import { IStockService } from '../../core/interfaces';
export declare class StockController {
    private readonly stockService;
    router: Router;
    constructor(stockService: IStockService);
    private initializeRoutes;
    private getAll;
    private getById;
    private create;
    private update;
    private delete;
    private createMovement;
    private getMovements;
}
export declare function createStockController(stockService: IStockService): StockController;
//# sourceMappingURL=stock.controller.d.ts.map