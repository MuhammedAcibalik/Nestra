/**
 * Stock Event Handlers
 * Handles events from other modules that require stock operations
 * Following Event-Driven Architecture for loose coupling
 * Uses EventAdapter for RabbitMQ/In-Memory abstraction
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, DomainEvents, StockConsumeRequestedPayload, getEventAdapter } from '../../core/events';
import { IStockRepository } from './stock.repository';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('StockEventHandler');

export class StockEventHandler {
    constructor(private readonly stockRepository: IStockRepository) { }

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Handle stock consume requests from other modules (e.g., Production)
        adapter.subscribe(EventTypes.STOCK_CONSUME_REQUESTED, this.handleConsumeRequested.bind(this));

        // Handle stock reserve requests from other modules (e.g., Optimization)
        adapter.subscribe(EventTypes.STOCK_RESERVE_REQUESTED, this.handleReserveRequested.bind(this));

        // Handle production completed - may trigger low stock alerts
        adapter.subscribe(EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));

        logger.info('Stock event handlers registered');
    }

    /**
     * Handle stock consume request from another module
     * Publishes STOCK_CONSUME_COMPLETED or STOCK_CONSUME_FAILED
     */
    private async handleConsumeRequested(event: IDomainEvent): Promise<void> {
        const payload = event.payload as unknown as StockConsumeRequestedPayload;
        const adapter = getEventAdapter();

        try {
            // Get current stock
            const stock = await this.stockRepository.findById(payload.stockItemId);

            if (!stock) {
                await adapter.publish(DomainEvents.stockConsumeFailed({
                    stockItemId: payload.stockItemId,
                    quantity: payload.quantity,
                    reason: 'Stock item not found',
                    correlationId: payload.correlationId
                }));
                return;
            }

            if (stock.quantity < payload.quantity) {
                await adapter.publish(DomainEvents.stockConsumeFailed({
                    stockItemId: payload.stockItemId,
                    quantity: payload.quantity,
                    reason: `Insufficient stock: ${stock.quantity} available, ${payload.quantity} requested`,
                    correlationId: payload.correlationId
                }));
                return;
            }

            // Create movement
            const movement = await this.stockRepository.createMovement({
                stockItemId: payload.stockItemId,
                movementType: 'CONSUMPTION',
                quantity: payload.quantity,
                notes: payload.reason,
                productionLogId: payload.productionLogId
            });

            // Update quantity
            await this.stockRepository.updateQuantity(payload.stockItemId, -payload.quantity);

            // Publish success
            await adapter.publish(DomainEvents.stockConsumeCompleted({
                stockItemId: payload.stockItemId,
                quantity: payload.quantity,
                movementId: movement.id,
                correlationId: payload.correlationId
            }));

            // Check for low stock alert
            const updatedStock = await this.stockRepository.findById(payload.stockItemId);
            if (updatedStock && updatedStock.quantity <= 5) {
                await adapter.publish(DomainEvents.stockLowAlert({
                    stockItemId: updatedStock.id,
                    stockCode: updatedStock.code,
                    currentQuantity: updatedStock.quantity,
                    minThreshold: 5
                }));
            }

        } catch (error) {
            await adapter.publish(DomainEvents.stockConsumeFailed({
                stockItemId: payload.stockItemId,
                quantity: payload.quantity,
                reason: error instanceof Error ? error.message : 'Unknown error',
                correlationId: payload.correlationId
            }));
        }
    }

    /**
     * Handle stock reserve request from optimization module
     */
    private async handleReserveRequested(event: IDomainEvent): Promise<void> {
        const payload = event.payload as {
            stockItemId: string;
            quantity: number;
            planId: string;
            correlationId: string;
        };
        const adapter = getEventAdapter();

        try {
            const stock = await this.stockRepository.findById(payload.stockItemId);

            if (!stock) {
                logger.error('Reserve failed: stock not found', { stockItemId: payload.stockItemId });
                return;
            }

            const available = stock.quantity - stock.reservedQty;
            if (available < payload.quantity) {
                logger.error('Reserve failed: insufficient available', { available, requested: payload.quantity });
                return;
            }

            // Update reserved quantity
            await this.stockRepository.updateQuantity(payload.stockItemId, 0, payload.quantity);

            await adapter.publish(DomainEvents.stockReserveCompleted({
                stockItemId: payload.stockItemId,
                quantity: payload.quantity,
                planId: payload.planId,
                correlationId: payload.correlationId
            }));

        } catch (error) {
            logger.error('Reserve failed', { error });
        }
    }

    /**
     * Handle production completed - check for alerts
     */
    private async handleProductionCompleted(event: IDomainEvent): Promise<void> {
        // Log for monitoring
        logger.info('Production completed', { aggregateId: event.aggregateId });
    }
}
