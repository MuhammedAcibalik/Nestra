import { OrderRepository } from '../order.repository';
import { PrismaClient } from '@prisma/client';
import { mock, MockProxy } from 'jest-mock-extended';

describe('OrderRepository', () => {
    let repository: OrderRepository;
    let prisma: MockProxy<PrismaClient>;
    let prismaOrder: any;
    let prismaOrderItem: any;

    beforeEach(() => {
        prisma = mock<PrismaClient>();
        prismaOrder = mock<any>();
        prismaOrderItem = mock<any>();
        (prisma as any).order = prismaOrder;
        (prisma as any).orderItem = prismaOrderItem;
        repository = new OrderRepository(prisma);
    });

    describe('create', () => {
        it('should create order with items', async () => {
            const input = {
                customerId: 'cust-1',
                dueDate: new Date(),
                priority: 1,
                items: [
                    {
                        itemCode: 'ITEM-1',
                        itemName: 'Test Item',
                        quantity: 10,
                        materialTypeId: 'mat-1',
                        thickness: 18,
                        length: 100,
                        width: 50,
                        geometryType: 'RECTANGLE'
                    }
                ]
            };

            prismaOrder.count.mockResolvedValue(0);
            const mockOrder = { id: 'order-1', orderNumber: 'ORD-000001', ...input };
            prismaOrder.create.mockResolvedValue(mockOrder);

            const result = await repository.create(input as any, 'user-1');

            expect(result).toEqual(mockOrder);
            expect(prismaOrder.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    orderNumber: 'ORD-000001',
                    createdById: 'user-1',
                    items: {
                        create: expect.arrayContaining([
                            expect.objectContaining({ itemCode: 'ITEM-1' })
                        ])
                    }
                })
            });
        });
    });

    describe('generateOrderNumber', () => {
        it('should generate sequential order number', async () => {
            prismaOrder.count.mockResolvedValue(5);
            const result = await repository.generateOrderNumber();
            expect(result).toBe('ORD-000006');
        });
    });

    describe('addItem', () => {
        it('should add item to order', async () => {
            const input = {
                itemCode: 'ITEM-2',
                itemName: 'New Item',
                quantity: 5,
                materialTypeId: 'mat-1',
                thickness: 18,
                length: 200,
                width: 100,
                geometryType: 'RECTANGLE'
            };
            const mockItem = { id: 'item-1', orderId: 'order-1', ...input };

            prismaOrderItem.create.mockResolvedValue(mockItem);

            const result = await repository.addItem('order-1', input as any);

            expect(result).toEqual(mockItem);
            expect(prismaOrderItem.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    orderId: 'order-1',
                    itemCode: 'ITEM-2'
                })
            });
        });
    });
});
