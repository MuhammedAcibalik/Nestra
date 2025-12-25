/**
 * Order Template Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for order template management only
 */

import {
    IResult,
    success,
    failure,
    IOrderTemplateDto,
    ICreateTemplateInput,
    IUpdateTemplateInput,
    ICreateOrderInput,
    ICreateOrderItemInput
} from '../../core/interfaces';
import { getErrorMessage } from './order.mapper';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('OrderTemplate');

/**
 * Template item stored in memory
 */
interface StoredTemplateItem {
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
}

/**
 * Template stored in memory
 */
interface StoredTemplate {
    id: string;
    name: string;
    description?: string;
    defaultCustomerId?: string;
    defaultPriority: number;
    items: StoredTemplateItem[];
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Order Template Service Interface
 * Following Interface Segregation Principle (ISP)
 */
export interface IOrderTemplateService {
    getTemplates(): Promise<IResult<IOrderTemplateDto[]>>;
    getTemplateById(id: string): Promise<IResult<IOrderTemplateDto>>;
    createTemplate(data: ICreateTemplateInput): Promise<IResult<IOrderTemplateDto>>;
    updateTemplate(id: string, data: IUpdateTemplateInput): Promise<IResult<IOrderTemplateDto>>;
    deleteTemplate(id: string): Promise<IResult<void>>;
    /**
     * Creates order input from template
     * Note: Actual order creation is delegated to OrderService
     */
    createOrderInputFromTemplate(
        templateId: string,
        overrides: Partial<ICreateOrderInput>
    ): Promise<IResult<ICreateOrderInput>>;
}

/**
 * Order Template Service Implementation
 * Uses in-memory storage (should be database in production)
 */
export class OrderTemplateService implements IOrderTemplateService {
    private readonly templates: Map<string, StoredTemplate> = new Map();

    async getTemplates(): Promise<IResult<IOrderTemplateDto[]>> {
        try {
            const templates = Array.from(this.templates.values()).map((t) => ({
                ...t,
                itemCount: t.items.length
            }));
            return success(templates);
        } catch (error) {
            return failure({
                code: 'TEMPLATE_FETCH_ERROR',
                message: 'Şablonlar getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
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
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async createTemplate(data: ICreateTemplateInput): Promise<IResult<IOrderTemplateDto>> {
        try {
            const id = crypto.randomUUID();
            const now = new Date();

            const template: StoredTemplate = {
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

            return success({
                ...template,
                itemCount: template.items.length
            });
        } catch (error) {
            return failure({
                code: 'TEMPLATE_CREATE_ERROR',
                message: 'Şablon oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
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

            const updated: StoredTemplate = {
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

            return success({
                ...updated,
                itemCount: updated.items.length
            });
        } catch (error) {
            return failure({
                code: 'TEMPLATE_UPDATE_ERROR',
                message: 'Şablon güncellenirken hata oluştu',
                details: { error: getErrorMessage(error) }
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
            logger.info(`Template deleted: ${id}`);

            return success(undefined);
        } catch (error) {
            return failure({
                code: 'TEMPLATE_DELETE_ERROR',
                message: 'Şablon silinirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async createOrderInputFromTemplate(
        templateId: string,
        overrides: Partial<ICreateOrderInput>
    ): Promise<IResult<ICreateOrderInput>> {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                return failure({
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Şablon bulunamadı'
                });
            }

            // Convert template items to order items
            const orderItems: ICreateOrderItemInput[] = template.items.map((item) => ({
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
            const orderInput: ICreateOrderInput = {
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

            return success(orderInput);
        } catch (error) {
            return failure({
                code: 'ORDER_FROM_TEMPLATE_ERROR',
                message: 'Şablondan sipariş oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }
}
