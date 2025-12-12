/**
 * Order Service Handler
 * Exposes order module as internal service
 * Following ISP - only exposes operations needed by other modules
 */

import {
    IServiceHandler,
    IServiceRequest,
    IServiceResponse
} from '../../core/services';
import { IOrderRepository } from './order.repository';

// ==================== INTERFACES ====================

export interface IOrderSummary {
    id: string;
    orderNumber: string;
    status: string;
    itemCount: number;
    createdAt: Date;
}

export interface IOrderItemSummary {
    id: string;
    itemCode: string | null;
    itemName: string | null;
    materialTypeId: string;
    thickness: number;
    quantity: number;
    geometryType: string;
}

// ==================== SERVICE HANDLER ====================

export class OrderServiceHandler implements IServiceHandler {
    constructor(private readonly repository: IOrderRepository) { }

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path } = request;

        // Route: GET /orders/:id
        if (method === 'GET' && /^\/orders\/[\w-]+$/.exec(path)) {
            const orderId = path.split('/')[2];
            return this.getOrderById(orderId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /orders/:id/items
        if (method === 'GET' && /^\/orders\/[\w-]+\/items$/.exec(path)) {
            const orderId = path.split('/')[2];
            return this.getOrderItems(orderId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /orders/confirmed
        if (method === 'GET' && path === '/orders/confirmed') {
            return this.getConfirmedOrders() as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getOrderById(orderId: string): Promise<IServiceResponse<IOrderSummary>> {
        try {
            const order = await this.repository.findById(orderId);

            if (!order) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Order not found' }
                };
            }

            return {
                success: true,
                data: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    itemCount: order._count?.items ?? 0,
                    createdAt: order.createdAt
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

    private async getOrderItems(orderId: string): Promise<IServiceResponse<IOrderItemSummary[]>> {
        try {
            const order = await this.repository.findById(orderId);

            if (!order || !order.items) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Order not found' }
                };
            }

            return {
                success: true,
                data: order.items.map(item => ({
                    id: item.id,
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    materialTypeId: item.materialTypeId,
                    thickness: item.thickness,
                    quantity: item.quantity,
                    geometryType: item.geometryType
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

    private async getConfirmedOrders(): Promise<IServiceResponse<IOrderSummary[]>> {
        try {
            const orders = await this.repository.findAll({ status: 'CONFIRMED' });

            return {
                success: true,
                data: orders.map(order => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    itemCount: order._count?.items ?? 0,
                    createdAt: order.createdAt
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
}
