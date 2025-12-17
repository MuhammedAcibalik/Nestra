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
    IMaterialDto,
    ILowStockAlert,
    IRegisterWasteInput
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

    // ==================== STOCK ALERTS ====================

    /**
     * Check all stock items and notify for low stock
     * Returns list of generated alerts
     */
    async checkAndNotifyLowStock(): Promise<IResult<ILowStockAlert[]>> {
        try {
            const items = await this.stockRepository.findAll();
            const alerts: ILowStockAlert[] = [];
            const DEFAULT_MIN_QTY = 5; // Default minimum quantity threshold

            for (const item of items) {
                const minQty = DEFAULT_MIN_QTY; // Could be per-item config
                let alertLevel: 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK' | null = null;

                if (item.quantity <= 0) {
                    alertLevel = 'OUT_OF_STOCK';
                } else if (item.quantity <= minQty) {
                    alertLevel = 'CRITICAL';
                } else if (item.quantity <= minQty * 1.5) {
                    alertLevel = 'WARNING';
                }

                if (alertLevel) {
                    const alert: ILowStockAlert = {
                        stockItemId: item.id,
                        stockCode: item.code,
                        stockName: item.name,
                        materialTypeName: item.materialType?.name ?? 'Unknown',
                        currentQuantity: item.quantity,
                        minQuantity: minQty,
                        alertLevel,
                        notifiedAt: new Date()
                    };
                    alerts.push(alert);

                    // Publish event for each alert
                    await this.publishEvent('StockLowAlert', item.id, {
                        alertLevel,
                        currentQuantity: item.quantity,
                        minQuantity: minQty
                    });

                    console.log(`[Stock] ${alertLevel} alert: ${item.code} (${item.quantity}/${minQty})`);
                }
            }

            return success(alerts);
        } catch (error) {
            return failure({
                code: 'STOCK_ALERT_ERROR',
                message: 'Stok uyarı kontrolü sırasında hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    /**
     * Get all low stock items based on threshold
     */
    async getLowStockItems(threshold = 5): Promise<IResult<IStockItemDto[]>> {
        try {
            const items = await this.stockRepository.findAll({ minQuantity: threshold });
            const lowItems = items.filter(item => item.quantity <= threshold);
            return success(lowItems.map(item => this.toDto(item)));
        } catch (error) {
            return failure({
                code: 'STOCK_FETCH_ERROR',
                message: 'Düşük stok kalemleri getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    // ==================== WASTE PIECE REGISTRATION ====================

    /**
     * Register waste piece from cutting as new stock item
     * Automatically creates stock entry with WASTE_REUSE movement
     */
    async registerWastePiece(data: IRegisterWasteInput): Promise<IResult<IStockItemDto>> {
        try {
            // Get source stock to inherit material type and thickness
            const sourceStock = await this.stockRepository.findById(data.sourceStockItemId);
            if (!sourceStock) {
                return failure({
                    code: 'SOURCE_NOT_FOUND',
                    message: 'Kaynak stok kalemi bulunamadı'
                });
            }

            // Generate unique waste code
            const wasteCode = `FIRE-${sourceStock.code}-${Date.now().toString(36).toUpperCase()}`;

            // Determine stock type based on dimensions
            const stockType = (data.length && !data.width && !data.height) ? 'BAR_1D' : 'SHEET_2D';

            // Create new stock item for waste
            const wasteItem = await this.stockRepository.create({
                code: wasteCode,
                name: `Fire: ${sourceStock.name}`,
                materialTypeId: sourceStock.materialTypeId,
                thickness: sourceStock.thickness,
                stockType: stockType as 'BAR_1D' | 'SHEET_2D',
                length: data.length,
                width: data.width,
                height: data.height,
                quantity: data.quantity,
                isFromWaste: true
            });

            // Create WASTE_REUSE movement
            await this.stockRepository.createMovement({
                stockItemId: wasteItem.id,
                movementType: 'WASTE_REUSE',
                quantity: data.quantity,
                notes: data.notes ?? `Fire parçası kaydı (Kaynak: ${sourceStock.code})`,
                productionLogId: data.productionLogId
            });

            await this.publishEvent('WastePieceRegistered', wasteItem.id, {
                sourceStockId: data.sourceStockItemId,
                sourceCode: sourceStock.code,
                wasteCode,
                quantity: data.quantity
            });

            console.log(`[Stock] Waste piece registered: ${wasteCode} from ${sourceStock.code}`);

            const fullItem = await this.stockRepository.findById(wasteItem.id);
            return success(this.toDto(fullItem!));
        } catch (error) {
            return failure({
                code: 'WASTE_REGISTER_ERROR',
                message: 'Fire parçası kaydedilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
}

