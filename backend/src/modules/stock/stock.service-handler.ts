/**
 * Stock Service Handler
 * Exposes stock module as internal service
 * Following ISP - only exposes needed operations
 */

import {
    IServiceHandler,
    IServiceRequest,
    IServiceResponse,
    IStockSummary,
    ICreateMovementData
} from '../../core/services';
import { IStockRepository } from './stock.repository';

export class StockServiceHandler implements IServiceHandler {
    constructor(private readonly repository: IStockRepository) { }

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path, data } = request;

        // Route: GET /stock/:id
        if (method === 'GET' && path.match(/^\/stock\/[\w-]+$/)) {
            const stockId = path.split('/')[2];
            return this.getStockById(stockId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: POST /movements
        if (method === 'POST' && path === '/movements') {
            return this.createMovement(data as ICreateMovementData) as Promise<IServiceResponse<TRes>>;
        }

        // Route: PUT /stock/:id/quantity
        if (method === 'PUT' && path.match(/^\/stock\/[\w-]+\/quantity$/)) {
            const stockId = path.split('/')[2];
            const { delta } = data as { delta: number };
            return this.updateQuantity(stockId, delta) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getStockById(stockId: string): Promise<IServiceResponse<IStockSummary>> {
        try {
            const stock = await this.repository.findById(stockId);

            if (!stock) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Stock item not found' }
                };
            }

            return {
                success: true,
                data: {
                    id: stock.id,
                    code: stock.code,
                    name: stock.name,
                    quantity: stock.quantity,
                    reservedQty: stock.reservedQty
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async createMovement(data: ICreateMovementData): Promise<IServiceResponse<{ id: string }>> {
        try {
            const movement = await this.repository.createMovement({
                stockItemId: data.stockItemId,
                movementType: data.movementType as 'CONSUMPTION' | 'PURCHASE' | 'ADJUSTMENT' | 'WASTE_REUSE' | 'SCRAP' | 'TRANSFER',
                quantity: data.quantity,
                notes: data.notes,
                productionLogId: data.productionLogId
            });

            return {
                success: true,
                data: { id: movement.id }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async updateQuantity(stockId: string, delta: number): Promise<IServiceResponse<void>> {
        try {
            await this.repository.updateQuantity(stockId, delta);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}
