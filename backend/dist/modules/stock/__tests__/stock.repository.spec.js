"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stock_repository_1 = require("../stock.repository");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('StockRepository', () => {
    let repository;
    let prisma;
    let prismaStock;
    let prismaMovement;
    beforeEach(() => {
        prisma = (0, jest_mock_extended_1.mock)();
        prismaStock = (0, jest_mock_extended_1.mock)();
        prismaMovement = (0, jest_mock_extended_1.mock)();
        prisma.stockItem = prismaStock;
        prisma.stockMovement = prismaMovement;
        repository = new stock_repository_1.StockRepository(prisma);
    });
    describe('create', () => {
        it('should create stock item', async () => {
            const input = {
                code: 'STK-001',
                name: 'MDF 18mm',
                materialTypeId: 'mat-1',
                thickness: 18,
                stockType: 'SHEET_2D',
                quantity: 10,
                unitPrice: 100
            };
            const mockItem = { id: 'item-1', ...input };
            prismaStock.create.mockResolvedValue(mockItem);
            const result = await repository.create(input);
            expect(result).toEqual(mockItem);
            expect(prismaStock.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    code: 'STK-001',
                    name: 'MDF 18mm'
                })
            });
        });
    });
    describe('updateQuantity', () => {
        it('should increment quantity', async () => {
            const mockItem = { id: 'item-1', quantity: 15, reservedQty: 0 };
            prismaStock.update.mockResolvedValue(mockItem);
            const result = await repository.updateQuantity('item-1', 5);
            expect(result).toEqual(mockItem);
            expect(prismaStock.update).toHaveBeenCalledWith({
                where: { id: 'item-1' },
                data: {
                    quantity: { increment: 5 },
                    reservedQty: { increment: 0 }
                }
            });
        });
    });
    describe('createMovement', () => {
        it('should create stock movement', async () => {
            const input = {
                stockItemId: 'item-1',
                movementType: 'PURCHASE',
                quantity: 10,
                notes: 'Test'
            };
            const mockMovement = { id: 'mov-1', ...input };
            prismaMovement.create.mockResolvedValue(mockMovement);
            const result = await repository.createMovement(input);
            expect(result).toEqual(mockMovement);
            expect(prismaMovement.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    stockItemId: 'item-1',
                    movementType: 'PURCHASE',
                    quantity: 10
                })
            });
        });
    });
});
//# sourceMappingURL=stock.repository.spec.js.map