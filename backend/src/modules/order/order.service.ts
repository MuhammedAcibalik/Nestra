/**
 * Order Service
 * Following Single Responsibility Principle (SRP)
 * Core order CRUD operations only
 * Import and Template operations are delegated to specialized services
 */

import {
    IOrderService,
    IOrderDto,
    IOrderItemDto,
    IOrderFilter,
    ICreateOrderInput,
    IUpdateOrderInput,
    ICreateOrderItemInput,
    IColumnMapping,
    IResult,
    success,
    failure,
    IOrderTemplateDto,
    ICreateTemplateInput,
    IUpdateTemplateInput
} from '../../core/interfaces';
import { IOrderRepository } from './order.repository';
import { EventBus, DomainEvents } from '../../core/events';
import { toOrderDto, toOrderItemDto, getErrorMessage } from './order.mapper';
import { IOrderImportService, OrderImportService } from './order-import.service';
import { IOrderTemplateService, OrderTemplateService } from './order-template.service';

/**
 * Order Service Implementation
 * Composes import and template services following Composition over Inheritance
 */
export class OrderService implements IOrderService {
    private readonly importService: IOrderImportService;
    private readonly templateService: IOrderTemplateService;

    constructor(
        private readonly orderRepository: IOrderRepository,
        importService?: IOrderImportService,
        templateService?: IOrderTemplateService
    ) {
        // Allow injection for testing, use defaults otherwise
        this.importService = importService ?? new OrderImportService();
        this.templateService = templateService ?? new OrderTemplateService();
    }

    // ==================== CORE CRUD OPERATIONS ====================

    async getOrders(filter?: IOrderFilter): Promise<IResult<IOrderDto[]>> {
        try {
            const orders = await this.orderRepository.findAll(filter);
            const dtos = orders.map((order) => toOrderDto(order));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'ORDER_FETCH_ERROR',
                message: 'Siparişler getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getOrderById(id: string): Promise<IResult<IOrderDto>> {
        try {
            const order = await this.orderRepository.findById(id);

            if (!order) {
                return failure({
                    code: 'ORDER_NOT_FOUND',
                    message: 'Sipariş bulunamadı'
                });
            }

            return success(toOrderDto(order));
        } catch (error) {
            return failure({
                code: 'ORDER_FETCH_ERROR',
                message: 'Sipariş getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async createOrder(data: ICreateOrderInput, userId: string): Promise<IResult<IOrderDto>> {
        try {
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    if (!item.materialTypeId || !item.quantity) {
                        return failure({
                            code: 'VALIDATION_ERROR',
                            message: 'Her sipariş satırı için malzeme türü ve miktar zorunludur'
                        });
                    }
                }
            }

            const order = await this.orderRepository.create(data, userId);
            const fullOrder = await this.orderRepository.findById(order.id);

            // Publish order created event
            const eventBus = EventBus.getInstance();
            await eventBus.publish(DomainEvents.orderCreated({
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerId: data.customerId,
                itemCount: data.items?.length ?? 0,
                createdById: userId
            }));

            return success(toOrderDto(fullOrder!));
        } catch (error) {
            return failure({
                code: 'ORDER_CREATE_ERROR',
                message: 'Sipariş oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async updateOrder(id: string, data: IUpdateOrderInput): Promise<IResult<IOrderDto>> {
        try {
            const existing = await this.orderRepository.findById(id);

            if (!existing) {
                return failure({
                    code: 'ORDER_NOT_FOUND',
                    message: 'Sipariş bulunamadı'
                });
            }

            const order = await this.orderRepository.update(id, data);
            const fullOrder = await this.orderRepository.findById(order.id);

            // Publish status update event if status changed
            if (data.status && data.status !== existing.status) {
                const eventBus = EventBus.getInstance();
                await eventBus.publish(DomainEvents.orderStatusUpdated({
                    orderId: order.id,
                    oldStatus: existing.status,
                    newStatus: data.status,
                    correlationId: order.id
                }));
            }

            return success(toOrderDto(fullOrder!));
        } catch (error) {
            return failure({
                code: 'ORDER_UPDATE_ERROR',
                message: 'Sipariş güncellenirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async deleteOrder(id: string): Promise<IResult<void>> {
        try {
            const existing = await this.orderRepository.findById(id);

            if (!existing) {
                return failure({
                    code: 'ORDER_NOT_FOUND',
                    message: 'Sipariş bulunamadı'
                });
            }

            await this.orderRepository.delete(id);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'ORDER_DELETE_ERROR',
                message: 'Sipariş silinirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async addOrderItem(orderId: string, data: ICreateOrderItemInput): Promise<IResult<IOrderItemDto>> {
        try {
            const order = await this.orderRepository.findById(orderId);

            if (!order) {
                return failure({
                    code: 'ORDER_NOT_FOUND',
                    message: 'Sipariş bulunamadı'
                });
            }

            const item = await this.orderRepository.addItem(orderId, data);
            return success(toOrderItemDto(item));
        } catch (error) {
            return failure({
                code: 'ORDER_ITEM_CREATE_ERROR',
                message: 'Sipariş satırı oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    // ==================== DELEGATED OPERATIONS ====================

    /**
     * Import orders from Excel/CSV file
     * Delegates parsing to OrderImportService
     */
    async importFromFile(file: Buffer, mapping: IColumnMapping, userId: string): Promise<IResult<IOrderDto>> {
        const importResult = await this.importService.importFromFile(file, mapping, userId);

        if (!importResult.success) {
            return failure(importResult.error!);
        }

        return this.createOrder(importResult.data!, userId);
    }

    // ==================== TEMPLATE OPERATIONS ====================

    async getTemplates(): Promise<IResult<IOrderTemplateDto[]>> {
        return this.templateService.getTemplates();
    }

    async getTemplateById(id: string): Promise<IResult<IOrderTemplateDto>> {
        return this.templateService.getTemplateById(id);
    }

    async createTemplate(data: ICreateTemplateInput): Promise<IResult<IOrderTemplateDto>> {
        return this.templateService.createTemplate(data);
    }

    async updateTemplate(id: string, data: IUpdateTemplateInput): Promise<IResult<IOrderTemplateDto>> {
        return this.templateService.updateTemplate(id, data);
    }

    async deleteTemplate(id: string): Promise<IResult<void>> {
        return this.templateService.deleteTemplate(id);
    }

    async createOrderFromTemplate(
        templateId: string,
        overrides: Partial<ICreateOrderInput>,
        userId: string
    ): Promise<IResult<IOrderDto>> {
        const inputResult = await this.templateService.createOrderInputFromTemplate(templateId, overrides);

        if (!inputResult.success) {
            return failure(inputResult.error!);
        }

        return this.createOrder(inputResult.data!, userId);
    }
}
