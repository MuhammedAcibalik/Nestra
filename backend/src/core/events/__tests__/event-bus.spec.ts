import { EventBus, createDomainEvent } from '../event-bus';

describe('EventBus', () => {
    let eventBus: EventBus;

    beforeEach(() => {
        EventBus.reset();
        eventBus = EventBus.getInstance();
    });

    it('should be a singleton', () => {
        const instance1 = EventBus.getInstance();
        const instance2 = EventBus.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should publish and subscribe to events', async () => {
        const eventType = 'test.event';
        const payload = { data: 'test' };
        const event = createDomainEvent(eventType, 'Test', '1', payload);
        const handler = jest.fn();

        eventBus.subscribe(eventType, handler);
        await eventBus.publish(event);

        expect(handler).toHaveBeenCalledWith(event);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers for same event', async () => {
        const eventType = 'test.event';
        const event = createDomainEvent(eventType, 'Test', '1', {});
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        eventBus.subscribe(eventType, handler1);
        eventBus.subscribe(eventType, handler2);
        await eventBus.publish(event);

        expect(handler1).toHaveBeenCalledWith(event);
        expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should unsubscribe handlers', async () => {
        const eventType = 'test.event';
        const event = createDomainEvent(eventType, 'Test', '1', {});
        const handler = jest.fn();

        eventBus.subscribe(eventType, handler);
        eventBus.unsubscribe(eventType);
        await eventBus.publish(event);

        expect(handler).not.toHaveBeenCalled();
    });

    it('should unsubscribe specific handler', async () => {
        const eventType = 'test.event';
        const event = createDomainEvent(eventType, 'Test', '1', {});
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        eventBus.subscribe(eventType, handler1);
        eventBus.subscribe(eventType, handler2);

        eventBus.unsubscribeHandler(eventType, handler1);
        await eventBus.publish(event);

        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should not break if handler fails', async () => {
        const eventType = 'test.event';
        const event = createDomainEvent(eventType, 'Test', '1', {});
        const errorHandler = jest.fn().mockRejectedValue(new Error('Fail'));
        const successHandler = jest.fn();

        eventBus.subscribe(eventType, errorHandler);
        eventBus.subscribe(eventType, successHandler);

        // Should not throw
        await eventBus.publish(event);

        expect(errorHandler).toHaveBeenCalled();
        expect(successHandler).toHaveBeenCalled();
    });

    it('should log events', async () => {
        const event = createDomainEvent('test.event', 'Test', '1', {});
        await eventBus.publish(event);

        const logs = eventBus.getRecentEvents();
        expect(logs).toHaveLength(1);
        expect(logs[0]).toEqual(event);
    });
});
