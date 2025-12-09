"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stock_service_1 = require("../stock.service");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('StockService', () => {
    let service;
    let repository;
    let eventPublisher;
    beforeEach(() => {
        repository = (0, jest_mock_extended_1.mock)();
        eventPublisher = (0, jest_mock_extended_1.mock)();
        service = new stock_service_1.StockService(repository, eventPublisher);
    });
    describe('createStockItem', () => {
        it('should create stock item and publish event', async () => {
            const input = {
                code: 'STK-001',
                name: 'MDF 18mm',
                materialTypeId: 'mat-1',
                thickness: 18,
                quantity: 10,
                stockType: 'SHEET_2D',
                length: 2800,
                width: 2100,
                height: 18
            };
            const savedItem = { ...input, id: '1', reservedQty: 0, isFromWaste: false };
            repository.findByCode.mockResolvedValue(null);
            repository.create.mockResolvedValue(savedItem);
            repository.findById.mockResolvedValue(savedItem);
            const result = await service.createStockItem(input);
            expect(result.success).toBe(true);
            expect(result.data?.code).toBe('STK-001');
            expect(repository.create).toHaveBeenCalledWith(input);
            expect(eventPublisher.publish).toHaveBeenCalled();
            const event = eventPublisher.publish.mock.calls[0][0];
            expect(event.eventType).toBe('StockItemCreated');
        });
        it('should fail if code exists', async () => {
            repository.findByCode.mockResolvedValue({ id: '1' });
            const result = await service.createStockItem({
                code: 'EXISTING',
                name: 'Test',
                materialTypeId: '1',
                quantity: 1,
                stockType: 'BAR_1D',
                length: 100
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('DUPLICATE_CODE');
        });
    });
    describe('createMovement', () => {
        it('should create movement and update stock', async () => {
            const stockItem = { id: '1', quantity: 100, reservedQty: 0 };
            const movementInput = {
                stockItemId: '1',
                movementType: 'CONSUMPTION',
                quantity: 10,
                notes: 'Test usage'
            };
            const savedMovement = { ...movementInput, id: 'mov-1', createdAt: new Date() };
            repository.findById.mockResolvedValue(stockItem);
            repository.createMovement.mockResolvedValue(savedMovement);
            const result = await service.createMovement(movementInput);
            expect(result.success).toBe(true);
            expect(repository.updateQuantity).toHaveBeenCalledWith('1', -10); // Consumption = negative delta
            expect(eventPublisher.publish).toHaveBeenCalled();
        });
        it('should fail if insufficient stock', async () => {
            const stockItem = { id: '1', quantity: 5, reservedQty: 0 }; // Only 5 available
            repository.findById.mockResolvedValue(stockItem);
            const result = await service.createMovement({
                stockItemId: '1',
                movementType: 'CONSUMPTION',
                quantity: 10
            });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INSUFFICIENT_STOCK');
        });
    });
});
//# sourceMappingURL=stock.service.spec.js.map