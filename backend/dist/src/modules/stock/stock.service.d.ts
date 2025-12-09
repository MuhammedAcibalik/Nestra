/**
 * Stock Service
 * Following SOLID principles:
 * - SRP: Only handles stock business logic
 * - DIP: Depends on IStockRepository abstraction
 * - OCP: Open for extension via new movement types
 *
 * Properly typed without any usage
 */
import { IStockService, IStockItemDto, IStockMovementDto, IStockFilter, ICreateStockInput, IUpdateStockInput, ICreateMovementInput, IMovementFilter, IResult, IEventPublisher } from '../../core/interfaces';
import { IStockRepository } from './stock.repository';
export declare class StockService implements IStockService {
    private readonly stockRepository;
    private readonly eventPublisher?;
    constructor(stockRepository: IStockRepository, eventPublisher?: IEventPublisher | undefined);
    getStockItems(filter?: IStockFilter): Promise<IResult<IStockItemDto[]>>;
    getStockItemById(id: string): Promise<IResult<IStockItemDto>>;
    createStockItem(data: ICreateStockInput): Promise<IResult<IStockItemDto>>;
    updateStockItem(id: string, data: IUpdateStockInput): Promise<IResult<IStockItemDto>>;
    deleteStockItem(id: string): Promise<IResult<void>>;
    createMovement(data: ICreateMovementInput): Promise<IResult<IStockMovementDto>>;
    getMovements(filter?: IMovementFilter): Promise<IResult<IStockMovementDto[]>>;
    private toDto;
    private validateCreateInput;
    private publishEvent;
    private getErrorMessage;
}
//# sourceMappingURL=stock.service.d.ts.map