"use strict";
/**
 * Order Service
 * Following SOLID principles - properly typed without any usage
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const interfaces_1 = require("../../core/interfaces");
const events_1 = require("../../core/events");
class OrderService {
    orderRepository;
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }
    async getOrders(filter) {
        try {
            const orders = await this.orderRepository.findAll(filter);
            const dtos = orders.map((order) => this.toDto(order));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_FETCH_ERROR',
                message: 'Siparişler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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
            return (0, interfaces_1.success)(this.toDto(order));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_FETCH_ERROR',
                message: 'Sipariş getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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
            return (0, interfaces_1.success)(this.toDto(fullOrder));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_CREATE_ERROR',
                message: 'Sipariş oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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
            // Publish order confirmed event if status changed to CONFIRMED
            if (data.status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
                const eventBus = events_1.EventBus.getInstance();
                await eventBus.publish(events_1.DomainEvents.orderConfirmed({
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    itemCount: fullOrder?.items?.length ?? 0,
                    confirmedById: 'system' // TODO: pass actual user ID
                }));
            }
            return (0, interfaces_1.success)(this.toDto(fullOrder));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_UPDATE_ERROR',
                message: 'Sipariş güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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
                details: { error: this.getErrorMessage(error) }
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
            if (!data.materialTypeId || !data.quantity) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Malzeme türü ve miktar zorunludur'
                });
            }
            const item = await this.orderRepository.addItem(orderId, data);
            return (0, interfaces_1.success)(this.toItemDto(item));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ORDER_ITEM_CREATE_ERROR',
                message: 'Sipariş satırı oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async importFromFile(file, mapping, userId) {
        try {
            const workbook = xlsx_1.default.read(file, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx_1.default.utils.sheet_to_json(worksheet);
            if (data.length === 0) {
                return (0, interfaces_1.failure)({
                    code: 'EMPTY_FILE',
                    message: 'Dosyada veri bulunamadı'
                });
            }
            const items = data.map((row) => this.mapRowToOrderItem(row, mapping));
            const orderInput = {
                notes: `İçe aktarılan dosyadan ${data.length} satır`,
                items
            };
            return this.createOrder(orderInput, userId);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'IMPORT_ERROR',
                message: 'Dosya içe aktarılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    mapRowToOrderItem(row, mapping) {
        return {
            itemCode: mapping.itemCode ? String(row[mapping.itemCode] ?? '') : undefined,
            itemName: mapping.itemName ? String(row[mapping.itemName] ?? '') : undefined,
            geometryType: mapping.geometryType ? String(row[mapping.geometryType] ?? 'RECTANGLE') : 'RECTANGLE',
            length: mapping.length ? this.parseNumber(row[mapping.length]) : undefined,
            width: mapping.width ? this.parseNumber(row[mapping.width]) : undefined,
            height: mapping.height ? this.parseNumber(row[mapping.height]) : undefined,
            materialTypeId: mapping.materialTypeId ? String(row[mapping.materialTypeId] ?? '') : '',
            thickness: mapping.thickness ? this.parseNumber(row[mapping.thickness]) ?? 0 : 0,
            quantity: mapping.quantity ? this.parseInt(row[mapping.quantity]) ?? 1 : 1,
            canRotate: mapping.canRotate ? row[mapping.canRotate] !== 'false' : true
        };
    }
    parseNumber(value) {
        if (typeof value !== 'string' && typeof value !== 'number')
            return undefined;
        if (value === '')
            return undefined;
        const num = Number.parseFloat(String(value));
        return Number.isNaN(num) ? undefined : num;
    }
    parseInt(value) {
        if (typeof value !== 'string' && typeof value !== 'number')
            return undefined;
        if (value === '')
            return undefined;
        const num = Number.parseInt(String(value), 10);
        return Number.isNaN(num) ? undefined : num;
    }
    toDto(order) {
        const customer = order.customer
            ? {
                id: order.customer.id,
                code: order.customer.code,
                name: order.customer.name
            }
            : undefined;
        return {
            id: order.id,
            orderNumber: order.orderNumber,
            customer,
            status: order.status,
            priority: order.priority,
            dueDate: order.dueDate ?? undefined,
            items: (order.items ?? []).map((item) => this.toItemDto(item)),
            itemCount: order._count?.items ?? order.items?.length ?? 0,
            createdAt: order.createdAt
        };
    }
    toItemDto(item) {
        return {
            id: item.id,
            itemCode: item.itemCode ?? undefined,
            itemName: item.itemName ?? undefined,
            geometryType: item.geometryType,
            length: item.length ?? undefined,
            width: item.width ?? undefined,
            height: item.height ?? undefined,
            diameter: item.diameter ?? undefined,
            thickness: item.thickness,
            quantity: item.quantity,
            producedQty: item.producedQty,
            canRotate: item.canRotate
        };
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=order.service.js.map