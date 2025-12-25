"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const order_service_1 = require("../order.service");
const events_1 = require("../../../core/events");
const jest_mock_extended_1 = require("jest-mock-extended");
// Don't mock the whole module, just spy on what we need
// jest.mock('../../../core/events'); 
describe('OrderService', () => {
    let service;
    let repository;
    let eventBusPublishSpy;
    beforeEach(() => {
        repository = (0, jest_mock_extended_1.mock)();
        service = new order_service_1.OrderService(repository);
        // Mock EventBus.publish
        const eventBus = events_1.EventBus.getInstance();
        eventBusPublishSpy = jest.spyOn(eventBus, 'publish').mockResolvedValue(undefined);
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    const createMockOrder = (overrides = {}) => ({
        id: 'order-1',
        orderNumber: 'ORD-001',
        customerId: 'cust-1',
        status: 'PENDING',
        priority: 'NORMAL',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { items: 0 },
        ...overrides
    });
    describe('createOrder', () => {
        it('should create an order successfully', async () => {
            const input = {
                customerId: 'cust-1',
                items: [
                    {
                        materialTypeId: 'mat-1',
                        quantity: 10,
                        geometryType: 'RECTANGLE',
                        thickness: 10
                    }
                ]
            };
            const userId = 'user-1';
            const mockOrder = createMockOrder({ items: [{ id: 'item-1', ...input.items[0] }] });
            repository.create.mockResolvedValue(mockOrder);
            repository.findById.mockResolvedValue(mockOrder);
            console.log('Calling createOrder in test...');
            const result = await service.createOrder(input, userId);
            if (!result.success) {
                console.log('CreateOrder Failed:', result.error);
            }
            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('order-1');
            expect(repository.create).toHaveBeenCalledWith(input, userId);
            // Verify event was published
            expect(eventBusPublishSpy).toHaveBeenCalled();
            const event = eventBusPublishSpy.mock.calls[0][0];
            expect(event.eventType).toBe('order.created');
            expect(event.payload.orderId).toBe('order-1');
        });
        it('should fail if items are invalid', async () => {
            const input = {
                items: [{ materialTypeId: '', quantity: 0 }]
            };
            const result = await service.createOrder(input, 'user-1');
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('updateOrder', () => {
        it('should update order status and publish event', async () => {
            const existingOrder = createMockOrder({ status: 'PENDING' });
            const updatedOrder = createMockOrder({ status: 'CONFIRMED' });
            repository.findById.mockResolvedValueOnce(existingOrder) // Check existing
                .mockResolvedValueOnce(updatedOrder); // Return updated
            repository.update.mockResolvedValue(updatedOrder);
            const result = await service.updateOrder('order-1', { status: 'CONFIRMED' });
            expect(result.success).toBe(true);
            expect(repository.update).toHaveBeenCalledWith('order-1', { status: 'CONFIRMED' });
            // Verify event
            expect(eventBusPublishSpy).toHaveBeenCalled();
            const event = eventBusPublishSpy.mock.calls[0][0];
            expect(event.eventType).toBe('order.status-updated');
        });
        it('should fail if order not found', async () => {
            repository.findById.mockResolvedValue(null);
            const result = await service.updateOrder('order-1', { status: 'CONFIRMED' });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('ORDER_NOT_FOUND');
        });
    });
    describe('getOrderById', () => {
        it('should return order if found', async () => {
            const mockOrder = createMockOrder();
            repository.findById.mockResolvedValue(mockOrder);
            const result = await service.getOrderById('order-1');
            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('order-1');
        });
    });
});
//# sourceMappingURL=order.service.spec.js.map