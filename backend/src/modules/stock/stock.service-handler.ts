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
    constructor(private readonly repository: IStockRepository) {}

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

        // Route: POST /stock/query/available (for Optimization)
        if (method === 'POST' && path === '/stock/query/available') {
            const params = data as {
                materialTypeId: string;
                thickness: number;
                stockType: 'BAR_1D' | 'SHEET_2D';
                selectedStockIds?: string[];
            };
            return this.getAvailableStock(params) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getAvailableStock(params: {
        materialTypeId: string;
        thickness: number;
        stockType: 'BAR_1D' | 'SHEET_2D';
        selectedStockIds?: string[];
    }): Promise<IServiceResponse<unknown>> {
        try {
            const allStock = await this.repository.findAll({
                materialTypeId: params.materialTypeId,
                stockType: params.stockType
            });

            // Filter by thickness and optionally by selected IDs
            let filtered = allStock.filter((s) => s.thickness === params.thickness);

            if (params.selectedStockIds && params.selectedStockIds.length > 0) {
                filtered = filtered.filter((s) => params.selectedStockIds!.includes(s.id));
            }

            // Sort by price (asc), then quantity (desc)
            filtered.sort((a, b) => {
                const priceA = a.unitPrice ?? Infinity;
                const priceB = b.unitPrice ?? Infinity;
                if (priceA !== priceB) return priceA - priceB;
                return b.quantity - a.quantity;
            });

            return {
                success: true,
                data: filtered.map((s) => ({
                    id: s.id,
                    code: s.code,
                    name: s.name,
                    stockType: s.stockType,
                    length: s.length,
                    width: s.width,
                    height: s.height,
                    quantity: s.quantity,
                    unitPrice: s.unitPrice
                }))
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
                movementType: data.movementType as
                    | 'CONSUMPTION'
                    | 'PURCHASE'
                    | 'ADJUSTMENT'
                    | 'WASTE_REUSE'
                    | 'SCRAP'
                    | 'TRANSFER',
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
