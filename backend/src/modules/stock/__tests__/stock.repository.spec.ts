import { StockRepository } from '../stock.repository';
import { PrismaClient } from '@prisma/client';
import { mock, MockProxy } from 'jest-mock-extended';

describe('StockRepository', () => {
    let repository: StockRepository;
    let prisma: MockProxy<PrismaClient>;
    let prismaStock: any;
    let prismaMovement: any;

    beforeEach(() => {
        prisma = mock<PrismaClient>();
        prismaStock = mock<any>();
        prismaMovement = mock<any>();
        (prisma as any).stockItem = prismaStock;
        (prisma as any).stockMovement = prismaMovement;
        repository = new StockRepository(prisma);
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

            const result = await repository.create(input as any);

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

            const result = await repository.createMovement(input as any);

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
