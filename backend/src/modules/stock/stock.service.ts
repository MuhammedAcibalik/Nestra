/**
 * Stock Service
 * Following SOLID principles:
 * - SRP: Only handles stock business logic
 * - DIP: Depends on IStockRepository abstraction
 * - OCP: Open for extension via new movement types
 * 
 * Properly typed without any usage
 */

import {
    IStockService,
    IStockItemDto,
    IStockMovementDto,
    IStockFilter,
    ICreateStockInput,
    IUpdateStockInput,
    ICreateMovementInput,
    IMovementFilter,
    IResult,
    success,
    failure,
    IDomainEvent,
    IEventPublisher,
    IMaterialDto
} from '../../core/interfaces';
import { IStockRepository, StockItemWithRelations } from './stock.repository';

const POSITIVE_MOVEMENT_TYPES = ['PURCHASE', 'WASTE_REUSE', 'ADJUSTMENT'] as const;

export class StockService implements IStockService {
    constructor(
        private readonly stockRepository: IStockRepository,
        private readonly eventPublisher?: IEventPublisher
    ) { }

    async getStockItems(filter?: IStockFilter): Promise<IResult<IStockItemDto[]>> {
        try {
            const items = await this.stockRepository.findAll(filter);
            const dtos = items.map((item) => this.toDto(item));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'STOCK_FETCH_ERROR',
                message: 'Stok kalemleri getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getStockItemById(id: string): Promise<IResult<IStockItemDto>> {
        try {
            const item = await this.stockRepository.findById(id);

            if (!item) {
                return failure({
                    code: 'STOCK_NOT_FOUND',
                    message: 'Stok kalemi bulunamadı'
                });
            }

            return success(this.toDto(item));
        } catch (error) {
            return failure({
                code: 'STOCK_FETCH_ERROR',
                message: 'Stok kalemi getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async createStockItem(data: ICreateStockInput): Promise<IResult<IStockItemDto>> {
        try {
            const validationError = this.validateCreateInput(data);
            if (validationError) {
                return failure(validationError);
            }

            const existing = await this.stockRepository.findByCode(data.code);
            if (existing) {
                return failure({
                    code: 'DUPLICATE_CODE',
                    message: 'Bu stok kodu zaten kullanılıyor'
                });
            }

            const item = await this.stockRepository.create(data);

            if (data.quantity > 0) {
                await this.stockRepository.createMovement({
                    stockItemId: item.id,
                    movementType: 'PURCHASE',
                    quantity: data.quantity,
                    notes: 'İlk stok girişi'
                });
            }

            await this.publishEvent('StockItemCreated', item.id, {
                code: item.code,
                quantity: item.quantity
            });

            const fullItem = await this.stockRepository.findById(item.id);
            return success(this.toDto(fullItem!));
        } catch (error) {
            return failure({
                code: 'STOCK_CREATE_ERROR',
                message: 'Stok kalemi oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async updateStockItem(id: string, data: IUpdateStockInput): Promise<IResult<IStockItemDto>> {
        try {
            const existing = await this.stockRepository.findById(id);
            if (!existing) {
                return failure({
                    code: 'STOCK_NOT_FOUND',
                    message: 'Stok kalemi bulunamadı'
                });
            }

            if (data.code && data.code !== existing.code) {
                const duplicate = await this.stockRepository.findByCode(data.code);
                if (duplicate) {
                    return failure({
                        code: 'DUPLICATE_CODE',
                        message: 'Bu stok kodu zaten kullanılıyor'
                    });
                }
            }

            const item = await this.stockRepository.update(id, data);
            const fullItem = await this.stockRepository.findById(item.id);
            return success(this.toDto(fullItem!));
        } catch (error) {
            return failure({
                code: 'STOCK_UPDATE_ERROR',
                message: 'Stok kalemi güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async deleteStockItem(id: string): Promise<IResult<void>> {
        try {
            const existing = await this.stockRepository.findById(id);
            if (!existing) {
                return failure({
                    code: 'STOCK_NOT_FOUND',
                    message: 'Stok kalemi bulunamadı'
                });
            }

            if (existing.reservedQty > 0) {
                return failure({
                    code: 'STOCK_RESERVED',
                    message: 'Rezerve edilmiş stok silinemez'
                });
            }

            await this.stockRepository.delete(id);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'STOCK_DELETE_ERROR',
                message: 'Stok kalemi silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async createMovement(data: ICreateMovementInput): Promise<IResult<IStockMovementDto>> {
        try {
            const stock = await this.stockRepository.findById(data.stockItemId);
            if (!stock) {
                return failure({
                    code: 'STOCK_NOT_FOUND',
                    message: 'Stok kalemi bulunamadı'
                });
            }

            const isPositive = POSITIVE_MOVEMENT_TYPES.includes(
                data.movementType as typeof POSITIVE_MOVEMENT_TYPES[number]
            );
            const quantityDelta = isPositive ? data.quantity : -data.quantity;

            if (!isPositive && stock.quantity < data.quantity) {
                return failure({
                    code: 'INSUFFICIENT_STOCK',
                    message: 'Yeterli stok yok'
                });
            }

            await this.stockRepository.updateQuantity(data.stockItemId, quantityDelta);
            const movement = await this.stockRepository.createMovement(data);

            await this.publishEvent('StockMovementCreated', data.stockItemId, {
                movementType: data.movementType,
                quantity: data.quantity
            });

            return success({
                id: movement.id,
                stockItemId: movement.stockItemId,
                movementType: movement.movementType,
                quantity: movement.quantity,
                notes: movement.notes ?? undefined,
                createdAt: movement.createdAt
            });
        } catch (error) {
            return failure({
                code: 'MOVEMENT_CREATE_ERROR',
                message: 'Stok hareketi oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getMovements(filter?: IMovementFilter): Promise<IResult<IStockMovementDto[]>> {
        try {
            const movements = await this.stockRepository.getMovements(filter);

            return success(movements.map((m) => ({
                id: m.id,
                stockItemId: m.stockItemId,
                movementType: m.movementType,
                quantity: m.quantity,
                notes: m.notes ?? undefined,
                createdAt: m.createdAt
            })));
        } catch (error) {
            return failure({
                code: 'MOVEMENTS_FETCH_ERROR',
                message: 'Stok hareketleri getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private toDto(item: StockItemWithRelations): IStockItemDto {
        const materialDto: IMaterialDto = {
            id: item.materialType?.id ?? '',
            name: item.materialType?.name ?? '',
            isRotatable: true,
            thicknessRanges: []
        };

        return {
            id: item.id,
            code: item.code,
            name: item.name,
            materialType: materialDto,
            thickness: item.thickness,
            stockType: item.stockType as 'BAR_1D' | 'SHEET_2D',
            length: item.length ?? undefined,
            width: item.width ?? undefined,
            height: item.height ?? undefined,
            quantity: item.quantity,
            reservedQty: item.reservedQty,
            availableQty: item.quantity - item.reservedQty,
            unitPrice: item.unitPrice ?? undefined,
            isFromWaste: item.isFromWaste
        };
    }

    private validateCreateInput(data: ICreateStockInput): { code: string; message: string } | null {
        if (!data.code || !data.name || !data.materialTypeId) {
            return {
                code: 'VALIDATION_ERROR',
                message: 'Kod, isim ve malzeme türü zorunludur'
            };
        }

        if (data.stockType === 'BAR_1D' && !data.length) {
            return {
                code: 'VALIDATION_ERROR',
                message: '1D stok için uzunluk zorunludur'
            };
        }

        if (data.stockType === 'SHEET_2D' && (!data.width || !data.height)) {
            return {
                code: 'VALIDATION_ERROR',
                message: '2D stok için genişlik ve yükseklik zorunludur'
            };
        }

        return null;
    }

    private async publishEvent(
        eventType: string,
        aggregateId: string,
        payload: Record<string, unknown>
    ): Promise<void> {
        if (!this.eventPublisher) return;

        const event: IDomainEvent = {
            eventId: crypto.randomUUID(),
            eventType,
            timestamp: new Date(),
            aggregateId,
            aggregateType: 'StockItem',
            payload
        };

        await this.eventPublisher.publish(event);
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
