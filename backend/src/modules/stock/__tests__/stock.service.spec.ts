import { StockService } from '../stock.service';
import { IStockRepository } from '../stock.repository';
import { IEventPublisher } from '../../../core/interfaces';
import { mock, MockProxy } from 'jest-mock-extended';

describe('StockService', () => {
    let service: StockService;
    let repository: MockProxy<IStockRepository>;
    let eventPublisher: MockProxy<IEventPublisher>;

    beforeEach(() => {
        repository = mock<IStockRepository>();
        eventPublisher = mock<IEventPublisher>();
        service = new StockService(repository, eventPublisher);
    });

    describe('createStockItem', () => {
        it('should create stock item and publish event', async () => {
            const input = {
                code: 'STK-001',
                name: 'MDF 18mm',
                materialTypeId: 'mat-1',
                thickness: 18,
                quantity: 10,
                stockType: 'SHEET_2D' as const,
                length: 2800,
                width: 2100,
                height: 18
            };

            const savedItem = { ...input, id: '1', reservedQty: 0, isFromWaste: false };

            repository.findByCode.mockResolvedValue(null);
            repository.create.mockResolvedValue(savedItem as any);
            repository.findById.mockResolvedValue(savedItem as any);

            const result = await service.createStockItem(input);

            expect(result.success).toBe(true);
            expect(result.data?.code).toBe('STK-001');
            expect(repository.create).toHaveBeenCalledWith(input);
            expect(eventPublisher.publish).toHaveBeenCalled();

            const event = eventPublisher.publish.mock.calls[0][0];
            expect(event.eventType).toBe('StockItemCreated');
        });

        it('should fail if code exists', async () => {
            repository.findByCode.mockResolvedValue({ id: '1' } as any);

            const result = await service.createStockItem({
                code: 'EXISTING',
                name: 'Test',
                materialTypeId: '1',
                quantity: 1,
                stockType: 'BAR_1D',
                length: 100
            } as any);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('DUPLICATE_CODE');
        });
    });

    describe('createMovement', () => {
        it('should create movement and update stock', async () => {
            const stockItem = { id: '1', quantity: 100, reservedQty: 0 };
            const movementInput = {
                stockItemId: '1',
                movementType: 'CONSUMPTION' as const,
                quantity: 10,
                notes: 'Test usage'
            };
            const savedMovement = { ...movementInput, id: 'mov-1', createdAt: new Date() };

            repository.findById.mockResolvedValue(stockItem as any);
            repository.createMovement.mockResolvedValue(savedMovement as any);

            const result = await service.createMovement(movementInput);

            expect(result.success).toBe(true);
            expect(repository.updateQuantity).toHaveBeenCalledWith('1', -10); // Consumption = negative delta
            expect(eventPublisher.publish).toHaveBeenCalled();
        });

        it('should fail if insufficient stock', async () => {
            const stockItem = { id: '1', quantity: 5, reservedQty: 0 }; // Only 5 available
            repository.findById.mockResolvedValue(stockItem as any);

            const result = await service.createMovement({
                stockItemId: '1',
                movementType: 'CONSUMPTION',
                quantity: 10
            } as any);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INSUFFICIENT_STOCK');
        });
    });
});
