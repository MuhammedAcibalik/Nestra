"use strict";
/**
 * Order Service
 * Following Single Responsibility Principle (SRP)
 * Core order CRUD operations only
 * Import and Template operations are delegated to specialized services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const interfaces_1 = require("../../core/interfaces");
const events_1 = require("../../core/events");
const order_mapper_1 = require("./order.mapper");
const order_import_service_1 = require("./order-import.service");
const order_template_service_1 = require("./order-template.service");
/**
 * Order Service Implementation
 * Composes import and template services following Composition over Inheritance
 */
class OrderService {
    orderRepository;
    importService;
    templateService;
    constructor(orderRepository, importService, templateService) {
        this.orderRepository = orderRepository;
        // Allow injection for testing, use defaults otherwise
        this.importService = importService ?? new order_import_service_1.OrderImportService();
        this.templateService = templateService ?? new order_template_service_1.OrderTemplateService();
    }
    // ==================== CORE CRUD OPERATIONS ====================
    async getOrders(filter) {
        try {
            const orders = await this.orderRepository.findAll(filter);
            const dtos = orders.map((order) => (0, order_mapper_1.toOrderDto)(order));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_FETCH_ERROR',
                message: 'Siparişler getirilirken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async getOrderById(id) {
        try {
            const order = await this.orderRepository.findById(id);
            if (!order) {
                return (0, interfaces_1.failure)({
                    code: 'ORDER_NOT_FOUND',
                    message: 'Sipariş bulunamadı'
                });
            }
            return (0, interfaces_1.success)((0, order_mapper_1.toOrderDto)(order));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_FETCH_ERROR',
                message: 'Sipariş getirilirken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async createOrder(data, userId) {
        try {
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    if (!item.materialTypeId || !item.quantity) {
                        return (0, interfaces_1.failure)({
                            code: 'VALIDATION_ERROR',
                            message: 'Her sipariş satırı için malzeme türü ve miktar zorunludur'
                        });
                    }
                }
            }
            const order = await this.orderRepository.create(data, userId);
            const fullOrder = await this.orderRepository.findById(order.id);
            // Publish order created event
            const eventBus = events_1.EventBus.getInstance();
            await eventBus.publish(events_1.DomainEvents.orderCreated({
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerId: data.customerId,
                itemCount: data.items?.length ?? 0,
                createdById: userId
            }));
            return (0, interfaces_1.success)((0, order_mapper_1.toOrderDto)(fullOrder));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_CREATE_ERROR',
                message: 'Sipariş oluşturulurken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async updateOrder(id, data) {
        try {
            const existing = await this.orderRepository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'ORDER_NOT_FOUND',
                    message: 'Sipariş bulunamadı'
                });
            }
            const order = await this.orderRepository.update(id, data);
            const fullOrder = await this.orderRepository.findById(order.id);
            // Publish status update event if status changed
            if (data.status && data.status !== existing.status) {
                const eventBus = events_1.EventBus.getInstance();
                await eventBus.publish(events_1.DomainEvents.orderStatusUpdated({
                    orderId: order.id,
                    oldStatus: existing.status,
                    newStatus: data.status,
                    correlationId: order.id
                }));
            }
            return (0, interfaces_1.success)((0, order_mapper_1.toOrderDto)(fullOrder));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_UPDATE_ERROR',
                message: 'Sipariş güncellenirken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async deleteOrder(id) {
        try {
            const existing = await this.orderRepository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'ORDER_NOT_FOUND',
                    message: 'Sipariş bulunamadı'
                });
            }
            await this.orderRepository.delete(id);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_DELETE_ERROR',
                message: 'Sipariş silinirken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async addOrderItem(orderId, data) {
        try {
            const order = await this.orderRepository.findById(orderId);
            if (!order) {
                return (0, interfaces_1.failure)({
                    code: 'ORDER_NOT_FOUND',
                    message: 'Sipariş bulunamadı'
                });
            }
            const item = await this.orderRepository.addItem(orderId, data);
            return (0, interfaces_1.success)((0, order_mapper_1.toOrderItemDto)(item));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_ITEM_CREATE_ERROR',
                message: 'Sipariş satırı oluşturulurken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    // ==================== DELEGATED OPERATIONS ====================
    /**
     * Import orders from Excel/CSV file
     * Delegates parsing to OrderImportService
     */
    async importFromFile(file, mapping, userId) {
        const importResult = await this.importService.importFromFile(file, mapping, userId);
        if (!importResult.success) {
            return (0, interfaces_1.failure)(importResult.error);
        }
        return this.createOrder(importResult.data, userId);
    }
    // ==================== TEMPLATE OPERATIONS ====================
    async getTemplates() {
        return this.templateService.getTemplates();
    }
    async getTemplateById(id) {
        return this.templateService.getTemplateById(id);
    }
    async createTemplate(data) {
        return this.templateService.createTemplate(data);
    }
    async updateTemplate(id, data) {
        return this.templateService.updateTemplate(id, data);
    }
    async deleteTemplate(id) {
        return this.templateService.deleteTemplate(id);
    }
    async createOrderFromTemplate(templateId, overrides, userId) {
        const inputResult = await this.templateService.createOrderInputFromTemplate(templateId, overrides);
        if (!inputResult.success) {
            return (0, interfaces_1.failure)(inputResult.error);
        }
        return this.createOrder(inputResult.data, userId);
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map