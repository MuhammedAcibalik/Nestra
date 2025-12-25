/**
 * Stock Service
 * Following SOLID principles:
 * - SRP: Only handles stock business logic
 * - DIP: Depends on IStockRepository abstraction
 * - OCP: Open for extension via new movement types
 * 
 * Core CRUD and movement operations - delegates alerts to sub-service
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
    ILowStockAlert,
    IRegisterWasteInput
} from '../../core/interfaces';
import { IStockRepository } from './stock.repository';
import {
    toStockItemDto,
    validateCreateInput,
    getErrorMessage,
    generateWasteCode,
    determineStockType
} from './stock.mapper';
import { IStockAlertService, StockAlertService } from './stock-alert.service';

const POSITIVE_MOVEMENT_TYPES = ['PURCHASE', 'WASTE_REUSE', 'ADJUSTMENT'] as const;

export class StockService implements IStockService {
    private readonly alertService: IStockAlertService;

    constructor(
        private readonly stockRepository: IStockRepository,
        private readonly eventPublisher?: IEventPublisher,
        alertService?: IStockAlertService
    ) {
        this.alertService = alertService ?? new StockAlertService(stockRepository);
    }

    // ==================== CORE CRUD OPERATIONS ====================

    async getStockItems(filter?: IStockFilter): Promise<IResult<IStockItemDto[]>> {
        try {
            const items = await this.stockRepository.findAll(filter);
            const dtos = items.map((item) => toStockItemDto(item));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'STOCK_FETCH_ERROR',
                message: 'Stok kalemleri getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
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

            return success(toStockItemDto(item));
        } catch (error) {
            return failure({
                code: 'STOCK_FETCH_ERROR',
                message: 'Stok kalemi getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async createStockItem(data: ICreateStockInput): Promise<IResult<IStockItemDto>> {
        try {
            const validationError = validateCreateInput(data);
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
            return success(toStockItemDto(fullItem!));
        } catch (error) {
            return failure({
                code: 'STOCK_CREATE_ERROR',
                message: 'Stok kalemi oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
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
            return success(toStockItemDto(fullItem!));
        } catch (error) {
            return failure({
                code: 'STOCK_UPDATE_ERROR',
                message: 'Stok kalemi güncellenirken hata oluştu',
                details: { error: getErrorMessage(error) }
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
                details: { error: getErrorMessage(error) }
            });
        }
    }

    // ==================== MOVEMENT OPERATIONS ====================

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
                details: { error: getErrorMessage(error) }
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
                details: { error: getErrorMessage(error) }
            });
        }
    }

    // ==================== WASTE PIECE REGISTRATION ====================

    async registerWastePiece(data: IRegisterWasteInput): Promise<IResult<IStockItemDto>> {
        try {
            const sourceStock = await this.stockRepository.findById(data.sourceStockItemId);
            if (!sourceStock) {
                return failure({
                    code: 'SOURCE_NOT_FOUND',
                    message: 'Kaynak stok kalemi bulunamadı'
                });
            }

            const wasteCode = generateWasteCode(sourceStock.code);
            const stockType = determineStockType(data.length, data.width, data.height);

            const wasteItem = await this.stockRepository.create({
                code: wasteCode,
                name: `Fire: ${sourceStock.name}`,
                materialTypeId: sourceStock.materialTypeId,
                thickness: sourceStock.thickness,
                stockType,
                length: data.length,
                width: data.width,
                height: data.height,
                quantity: data.quantity,
                isFromWaste: true
            });

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
            return success(toStockItemDto(fullItem!));
        } catch (error) {
            return failure({
                code: 'WASTE_REGISTER_ERROR',
                message: 'Fire parçası kaydedilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    // ==================== DELEGATED OPERATIONS ====================

    async checkAndNotifyLowStock(): Promise<IResult<ILowStockAlert[]>> {
        return this.alertService.checkAndNotifyLowStock();
    }

    async getLowStockItems(threshold = 5): Promise<IResult<IStockItemDto[]>> {
        return this.alertService.getLowStockItems(threshold);
    }

    // ==================== PRIVATE HELPERS ====================

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
}
