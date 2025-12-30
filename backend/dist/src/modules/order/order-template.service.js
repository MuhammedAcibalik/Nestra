"use strict";
/**
 * Order Template Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for order template management only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderTemplateService = void 0;
const interfaces_1 = require("../../core/interfaces");
const order_mapper_1 = require("./order.mapper");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('OrderTemplate');
/**
 * Order Template Service Implementation
 * Uses in-memory storage (should be database in production)
 */
class OrderTemplateService {
    templates = new Map();
    async getTemplates() {
        try {
            const templates = Array.from(this.templates.values()).map((t) => ({
                ...t,
                itemCount: t.items.length
            }));
            return (0, interfaces_1.success)(templates);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'TEMPLATE_FETCH_ERROR',
                message: 'Şablonlar getirilirken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async getTemplateById(id) {
        try {
            const template = this.templates.get(id);
            if (!template) {
                return (0, interfaces_1.failure)({
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Şablon bulunamadı'
                });
            }
            return (0, interfaces_1.success)({
                ...template,
                itemCount: template.items.length
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'TEMPLATE_FETCH_ERROR',
                message: 'Şablon getirilirken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async createTemplate(data) {
        try {
            const id = crypto.randomUUID();
            const now = new Date();
            const template = {
                id,
                name: data.name,
                description: data.description,
                defaultCustomerId: data.defaultCustomerId,
                defaultPriority: data.defaultPriority ?? 1,
                items: data.items.map((item) => ({
                    id: crypto.randomUUID(),
                    itemCode: item.itemCode,
                    itemName: item.itemName,
                    geometryType: item.geometryType,
                    length: item.length,
                    width: item.width,
                    height: item.height,
                    materialTypeId: item.materialTypeId,
                    thickness: item.thickness,
                    quantity: item.quantity,
                    canRotate: item.canRotate ?? true
                })),
                usageCount: 0,
                createdAt: now,
                updatedAt: now
            };
            this.templates.set(id, template);
            logger.info(`Template created: ${data.name}`);
            return (0, interfaces_1.success)({
                ...template,
                itemCount: template.items.length
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'TEMPLATE_CREATE_ERROR',
                message: 'Şablon oluşturulurken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async updateTemplate(id, data) {
        try {
            const template = this.templates.get(id);
            if (!template) {
                return (0, interfaces_1.failure)({
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Şablon bulunamadı'
                });
            }
            const updated = {
                ...template,
                name: data.name ?? template.name,
                description: data.description ?? template.description,
                defaultCustomerId: data.defaultCustomerId ?? template.defaultCustomerId,
                defaultPriority: data.defaultPriority ?? template.defaultPriority,
                items: data.items
                    ? data.items.map((item) => ({
                        id: crypto.randomUUID(),
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        geometryType: item.geometryType,
                        length: item.length,
                        width: item.width,
                        height: item.height,
                        materialTypeId: item.materialTypeId,
                        thickness: item.thickness,
                        quantity: item.quantity,
                        canRotate: item.canRotate ?? true
                    }))
                    : template.items,
                updatedAt: new Date()
            };
            this.templates.set(id, updated);
            logger.info(`Template updated: ${updated.name}`);
            return (0, interfaces_1.success)({
                ...updated,
                itemCount: updated.items.length
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'TEMPLATE_UPDATE_ERROR',
                message: 'Şablon güncellenirken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async deleteTemplate(id) {
        try {
            if (!this.templates.has(id)) {
                return (0, interfaces_1.failure)({
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Şablon bulunamadı'
                });
            }
            this.templates.delete(id);
            logger.info(`Template deleted: ${id}`);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'TEMPLATE_DELETE_ERROR',
                message: 'Şablon silinirken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async createOrderInputFromTemplate(templateId, overrides) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                return (0, interfaces_1.failure)({
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Şablon bulunamadı'
                });
            }
            // Convert template items to order items
            const orderItems = template.items.map((item) => ({
                itemCode: item.itemCode,
                itemName: item.itemName,
                geometryType: item.geometryType,
                length: item.length,
                width: item.width,
                height: item.height,
                materialTypeId: item.materialTypeId,
                thickness: item.thickness,
                quantity: item.quantity,
                canRotate: item.canRotate
            }));
            // Create order input with template defaults, allow overrides
            const orderInput = {
                customerId: overrides.customerId ?? template.defaultCustomerId,
                priority: overrides.priority ?? template.defaultPriority,
                dueDate: overrides.dueDate,
                notes: overrides.notes ?? `Şablondan oluşturuldu: ${template.name}`,
                items: overrides.items ?? orderItems
            };
            // Increment usage count
            template.usageCount++;
            this.templates.set(templateId, template);
            logger.info(`Order input created from template: ${template.name}`);
            return (0, interfaces_1.success)(orderInput);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_FROM_TEMPLATE_ERROR',
                message: 'Şablondan sipariş oluşturulurken hata oluştu',
                details: { error: (0, order_mapper_1.getErrorMessage)(error) }
            });
        }
    }
}
exports.OrderTemplateService = OrderTemplateService;
//# sourceMappingURL=order-template.service.js.map