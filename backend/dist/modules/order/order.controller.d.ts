/**
 * Order Controller
 */
import { Router } from 'express';
import { IOrderService } from '../../core/interfaces';
export declare class OrderController {
    private readonly orderService;
    router: Router;
    constructor(orderService: IOrderService);
    private initializeRoutes;
    private getAll;
    private getById;
    private create;
    private update;
    private delete;
    private addItem;
    private importFromFile;
}
export declare function createOrderController(orderService: IOrderService): OrderController;
//# sourceMappingURL=order.controller.d.ts.map