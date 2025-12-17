/**
 * Order Service
 * Following SOLID principles - properly typed without any usage
 */

import xlsx from 'xlsx';
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
    ICustomerDto,
    IOrderTemplateDto,
    ICreateTemplateInput,
    IUpdateTemplateInput,
    ITemplateItemDto
} from '../../core/interfaces';
import { IOrderRepository, OrderWithRelations, OrderItem } from './order.repository';
import { EventBus, DomainEvents } from '../../core/events';

interface ExcelRow {
    [key: string]: string | number | boolean | undefined;
}

export class OrderService implements IOrderService {
    constructor(private readonly orderRepository: IOrderRepository) { }

    async getOrders(filter?: IOrderFilter): Promise<IResult<IOrderDto[]>> {
        try {
            const orders = await this.orderRepository.findAll(filter);
            const dtos = orders.map((order) => this.toDto(order));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'ORDER_FETCH_ERROR',
                message: 'Siparişler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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

            return success(this.toDto(order));
        } catch (error) {
            return failure({
                code: 'ORDER_FETCH_ERROR',
                message: 'Sipariş getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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

            return success(this.toDto(fullOrder!));
        } catch (error) {
            return failure({
                code: 'ORDER_CREATE_ERROR',
                message: 'Sipariş oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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

            // Publish order confirmed event if status changed to CONFIRMED
            if (data.status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
                const eventBus = EventBus.getInstance();
                await eventBus.publish(DomainEvents.orderConfirmed({
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    itemCount: fullOrder?.items?.length ?? 0,
                    confirmedById: 'system' // TODO: pass actual user ID
                }));
            }

            return success(this.toDto(fullOrder!));
        } catch (error) {
            return failure({
                code: 'ORDER_UPDATE_ERROR',
                message: 'Sipariş güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
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
                details: { error: this.getErrorMessage(error) }
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

            if (!data.materialTypeId || !data.quantity) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Malzeme türü ve miktar zorunludur'
                });
            }

            const item = await this.orderRepository.addItem(orderId, data);

            return success(this.toItemDto(item));
        } catch (error) {
            return failure({
                code: 'ORDER_ITEM_CREATE_ERROR',
                message: 'Sipariş satırı oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async importFromFile(file: Buffer, mapping: IColumnMapping, userId: string): Promise<IResult<IOrderDto>> {
        try {
            const workbook = xlsx.read(file, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data: ExcelRow[] = xlsx.utils.sheet_to_json(worksheet);

            if (data.length === 0) {
                return failure({
                    code: 'EMPTY_FILE',
                    message: 'Dosyada veri bulunamadı'
                });
            }

            const items: ICreateOrderItemInput[] = data.map((row) => this.mapRowToOrderItem(row, mapping));

            const orderInput: ICreateOrderInput = {
                notes: `İçe aktarılan dosyadan ${data.length} satır`,
                items
            };

            return this.createOrder(orderInput, userId);
        } catch (error) {
            return failure({
                code: 'IMPORT_ERROR',
                message: 'Dosya içe aktarılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private mapRowToOrderItem(row: ExcelRow, mapping: IColumnMapping): ICreateOrderItemInput {
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

    private parseNumber(value: unknown): number | undefined {
        if (typeof value !== 'string' && typeof value !== 'number') return undefined;
        if (value === '') return undefined;
        const num = Number.parseFloat(String(value));
        return Number.isNaN(num) ? undefined : num;
    }

    private parseInt(value: unknown): number | undefined {
        if (typeof value !== 'string' && typeof value !== 'number') return undefined;
        if (value === '') return undefined;
        const num = Number.parseInt(String(value), 10);
        return Number.isNaN(num) ? undefined : num;
    }

    private toDto(order: OrderWithRelations): IOrderDto {
        const customer: ICustomerDto | undefined = order.customer
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

    private toItemDto(item: OrderItem): IOrderItemDto {
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

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }

    // ==================== ORDER TEMPLATES ====================

    // In-memory template storage (should be database in production)
    private templates: Map<string, {
        id: string;
        name: string;
        description?: string;
        defaultCustomerId?: string;
        defaultPriority: number;
        items: Array<{
            id: string;
            itemCode?: string;
            itemName?: string;
            geometryType: string;
            length?: number;
            width?: number;
            height?: number;
            materialTypeId: string;
            thickness: number;
            quantity: number;
            canRotate: boolean;
        }>;
        usageCount: number;
        createdAt: Date;
        updatedAt: Date;
    }> = new Map();

    async getTemplates(): Promise<IResult<IOrderTemplateDto[]>> {
        try {
            const templates = Array.from(this.templates.values()).map(t => ({
                ...t,
                itemCount: t.items.length
            }));
            return success(templates);
        } catch (error) {
            return failure({
                code: 'TEMPLATE_FETCH_ERROR',
                message: 'Şablonlar getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getTemplateById(id: string): Promise<IResult<IOrderTemplateDto>> {
        try {
            const template = this.templates.get(id);
            if (!template) {
                return failure({
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Şablon bulunamadı'
                });
            }
            return success({
                ...template,
                itemCount: template.items.length
            });
        } catch (error) {
            return failure({
                code: 'TEMPLATE_FETCH_ERROR',
                message: 'Şablon getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async createTemplate(data: ICreateTemplateInput): Promise<IResult<IOrderTemplateDto>> {
        try {
            const id = crypto.randomUUID();
            const now = new Date();

            const template = {
                id,
                name: data.name,
                description: data.description,
                defaultCustomerId: data.defaultCustomerId,
                defaultPriority: data.defaultPriority ?? 1,
                items: data.items.map(item => ({
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
            console.log(`[Order] Template created: ${data.name}`);

            return success({
                ...template,
                itemCount: template.items.length
            });
        } catch (error) {
            return failure({
                code: 'TEMPLATE_CREATE_ERROR',
                message: 'Şablon oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async updateTemplate(id: string, data: IUpdateTemplateInput): Promise<IResult<IOrderTemplateDto>> {
        try {
            const template = this.templates.get(id);
            if (!template) {
                return failure({
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
                items: data.items ? data.items.map(item => ({
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
                })) : template.items,
                updatedAt: new Date()
            };

            this.templates.set(id, updated);
            console.log(`[Order] Template updated: ${updated.name}`);

            return success({
                ...updated,
                itemCount: updated.items.length
            });
        } catch (error) {
            return failure({
                code: 'TEMPLATE_UPDATE_ERROR',
                message: 'Şablon güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async deleteTemplate(id: string): Promise<IResult<void>> {
        try {
            if (!this.templates.has(id)) {
                return failure({
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Şablon bulunamadı'
                });
            }

            this.templates.delete(id);
            console.log(`[Order] Template deleted: ${id}`);

            return success(undefined);
        } catch (error) {
            return failure({
                code: 'TEMPLATE_DELETE_ERROR',
                message: 'Şablon silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async createOrderFromTemplate(
        templateId: string,
        overrides: Partial<ICreateOrderInput>,
        userId: string
    ): Promise<IResult<IOrderDto>> {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                return failure({
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Şablon bulunamadı'
                });
            }

            // Convert template items to order items
            const orderItems: ICreateOrderItemInput[] = template.items.map(item => ({
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

            // Create order with template defaults, allow overrides
            const orderInput: ICreateOrderInput = {
                customerId: overrides.customerId ?? template.defaultCustomerId,
                priority: overrides.priority ?? template.defaultPriority,
                dueDate: overrides.dueDate,
                notes: overrides.notes ?? `Şablondan oluşturuldu: ${template.name}`,
                items: overrides.items ?? orderItems
            };

            const result = await this.createOrder(orderInput, userId);

            if (result.success) {
                // Increment usage count
                template.usageCount++;
                this.templates.set(templateId, template);
                console.log(`[Order] Order created from template: ${template.name}`);
            }

            return result;
        } catch (error) {
            return failure({
                code: 'ORDER_FROM_TEMPLATE_ERROR',
                message: 'Şablondan sipariş oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
}

