"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_repository_1 = require("../order.repository");
const db_mock_1 = require("../../../core/test/db-mock");
describe('OrderRepository', () => {
    let repository;
    let db;
    beforeEach(() => {
        db = (0, db_mock_1.createMockDatabase)();
        repository = new order_repository_1.OrderRepository(db);
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
            const mockOrder = { id: 'order-1', orderNumber: 'ORD-000001', ...input };
            db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([{ count: 0 }])
                })
            });
            db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockOrder])
                })
            });
            const result = await repository.create(input, 'user-1');
            expect(result.id).toBe('order-1');
            expect(result.orderNumber).toBe('ORD-000001');
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
            db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockItem])
                })
            });
            const result = await repository.addItem('order-1', input);
            expect(result.id).toBe('item-1');
            expect(result.itemCode).toBe('ITEM-2');
        });
    });
});
//# sourceMappingURL=order.repository.spec.js.map