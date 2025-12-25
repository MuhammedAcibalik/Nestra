/**
 * Order Template Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for order template management only
 */
import { IResult, IOrderTemplateDto, ICreateTemplateInput, IUpdateTemplateInput, ICreateOrderInput } from '../../core/interfaces';
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
    createOrderInputFromTemplate(templateId: string, overrides: Partial<ICreateOrderInput>): Promise<IResult<ICreateOrderInput>>;
}
/**
 * Order Template Service Implementation
 * Uses in-memory storage (should be database in production)
 */
export declare class OrderTemplateService implements IOrderTemplateService {
    private readonly templates;
    getTemplates(): Promise<IResult<IOrderTemplateDto[]>>;
    getTemplateById(id: string): Promise<IResult<IOrderTemplateDto>>;
    createTemplate(data: ICreateTemplateInput): Promise<IResult<IOrderTemplateDto>>;
    updateTemplate(id: string, data: IUpdateTemplateInput): Promise<IResult<IOrderTemplateDto>>;
    deleteTemplate(id: string): Promise<IResult<void>>;
    createOrderInputFromTemplate(templateId: string, overrides: Partial<ICreateOrderInput>): Promise<IResult<ICreateOrderInput>>;
}
//# sourceMappingURL=order-template.service.d.ts.map