import { OrderRepository } from '../order.repository';
import { createMockDatabase, MockProxy } from '../../../core/test/db-mock';
import { Database } from '../../../db';

describe('OrderRepository', () => {
    let repository: OrderRepository;
    let db: MockProxy<Database>;

    beforeEach(() => {
        db = createMockDatabase();
        repository = new OrderRepository(db);
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

            (db.select as jest.Mock).mockReturnValue({
                from: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([{ count: 0 }])
                })
            });

            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockOrder])
                })
            });

            const result = await repository.create(input as any, 'user-1');

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

            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockItem])
                })
            });

            const result = await repository.addItem('order-1', input as any);

            expect(result.id).toBe('item-1');
            expect(result.itemCode).toBe('ITEM-2');
        });
    });
});
