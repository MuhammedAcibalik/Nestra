/**
 * Stock Service
 * Following SOLID principles:
 * - SRP: Only handles stock business logic
 * - DIP: Depends on IStockRepository abstraction
 * - OCP: Open for extension via new movement types
 *
 * Core CRUD and movement operations - delegates alerts to sub-service
 */
import { IStockService, IStockItemDto, IStockMovementDto, IStockFilter, ICreateStockInput, IUpdateStockInput, ICreateMovementInput, IMovementFilter, IResult, IEventPublisher, ILowStockAlert, IRegisterWasteInput } from '../../core/interfaces';
import { IStockRepository } from './stock.repository';
import { IStockAlertService } from './stock-alert.service';
export declare class StockService implements IStockService {
    private readonly stockRepository;
    private readonly eventPublisher?;
    private readonly alertService;
    constructor(stockRepository: IStockRepository, eventPublisher?: IEventPublisher | undefined, alertService?: IStockAlertService);
    getStockItems(filter?: IStockFilter): Promise<IResult<IStockItemDto[]>>;
    getStockItemById(id: string): Promise<IResult<IStockItemDto>>;
    createStockItem(data: ICreateStockInput): Promise<IResult<IStockItemDto>>;
    updateStockItem(id: string, data: IUpdateStockInput): Promise<IResult<IStockItemDto>>;
    deleteStockItem(id: string): Promise<IResult<void>>;
    createMovement(data: ICreateMovementInput): Promise<IResult<IStockMovementDto>>;
    getMovements(filter?: IMovementFilter): Promise<IResult<IStockMovementDto[]>>;
    registerWastePiece(data: IRegisterWasteInput): Promise<IResult<IStockItemDto>>;
    checkAndNotifyLowStock(): Promise<IResult<ILowStockAlert[]>>;
    getLowStockItems(threshold?: number): Promise<IResult<IStockItemDto[]>>;
    private publishEvent;
}
//# sourceMappingURL=stock.service.d.ts.map