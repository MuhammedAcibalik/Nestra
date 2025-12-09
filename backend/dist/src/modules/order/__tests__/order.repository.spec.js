"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_repository_1 = require("../order.repository");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('OrderRepository', () => {
    let repository;
    let prisma;
    let prismaOrder;
    let prismaOrderItem;
    beforeEach(() => {
        prisma = (0, jest_mock_extended_1.mock)();
        prismaOrder = (0, jest_mock_extended_1.mock)();
        prismaOrderItem = (0, jest_mock_extended_1.mock)();
        prisma.order = prismaOrder;
        prisma.orderItem = prismaOrderItem;
        repository = new order_repository_1.OrderRepository(prisma);
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
            const result = await repository.create(input, 'user-1');
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
            const result = await repository.addItem('order-1', input);
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
//# sourceMappingURL=order.repository.spec.js.map