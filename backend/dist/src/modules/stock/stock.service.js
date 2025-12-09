"use strict";
/**
 * Stock Service
 * Following SOLID principles:
 * - SRP: Only handles stock business logic
 * - DIP: Depends on IStockRepository abstraction
 * - OCP: Open for extension via new movement types
 *
 * Properly typed without any usage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const interfaces_1 = require("../../core/interfaces");
const POSITIVE_MOVEMENT_TYPES = ['PURCHASE', 'WASTE_REUSE', 'ADJUSTMENT'];
class StockService {
    stockRepository;
    eventPublisher;
    constructor(stockRepository, eventPublisher) {
        this.stockRepository = stockRepository;
        this.eventPublisher = eventPublisher;
    }
    async getStockItems(filter) {
        try {
            const items = await this.stockRepository.findAll(filter);
            const dtos = items.map((item) => this.toDto(item));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_FETCH_ERROR',
                message: 'Stok kalemleri getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getStockItemById(id) {
        try {
            const item = await this.stockRepository.findById(id);
            if (!item) {
                return (0, interfaces_1.failure)({
                    code: 'STOCK_NOT_FOUND',
                    message: 'Stok kalemi bulunamadı'
                });
            }
            return (0, interfaces_1.success)(this.toDto(item));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_FETCH_ERROR',
                message: 'Stok kalemi getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async createStockItem(data) {
        try {
            const validationError = this.validateCreateInput(data);
            if (validationError) {
                return (0, interfaces_1.failure)(validationError);
            }
            const existing = await this.stockRepository.findByCode(data.code);
            if (existing) {
                return (0, interfaces_1.failure)({
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
            return (0, interfaces_1.success)(this.toDto(fullItem));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_CREATE_ERROR',
                message: 'Stok kalemi oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async updateStockItem(id, data) {
        try {
            const existing = await this.stockRepository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'STOCK_NOT_FOUND',
                    message: 'Stok kalemi bulunamadı'
                });
            }
            if (data.code && data.code !== existing.code) {
                const duplicate = await this.stockRepository.findByCode(data.code);
                if (duplicate) {
                    return (0, interfaces_1.failure)({
                        code: 'DUPLICATE_CODE',
                        message: 'Bu stok kodu zaten kullanılıyor'
                    });
                }
            }
            const item = await this.stockRepository.update(id, data);
            const fullItem = await this.stockRepository.findById(item.id);
            return (0, interfaces_1.success)(this.toDto(fullItem));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_UPDATE_ERROR',
                message: 'Stok kalemi güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async deleteStockItem(id) {
        try {
            const existing = await this.stockRepository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'STOCK_NOT_FOUND',
                    message: 'Stok kalemi bulunamadı'
                });
            }
            if (existing.reservedQty > 0) {
                return (0, interfaces_1.failure)({
                    code: 'STOCK_RESERVED',
                    message: 'Rezerve edilmiş stok silinemez'
                });
            }
            await this.stockRepository.delete(id);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_DELETE_ERROR',
                message: 'Stok kalemi silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async createMovement(data) {
        try {
            const stock = await this.stockRepository.findById(data.stockItemId);
            if (!stock) {
                return (0, interfaces_1.failure)({
                    code: 'STOCK_NOT_FOUND',
                    message: 'Stok kalemi bulunamadı'
                });
            }
            const isPositive = POSITIVE_MOVEMENT_TYPES.includes(data.movementType);
            const quantityDelta = isPositive ? data.quantity : -data.quantity;
            if (!isPositive && stock.quantity < data.quantity) {
                return (0, interfaces_1.failure)({
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
            return (0, interfaces_1.success)({
                id: movement.id,
                stockItemId: movement.stockItemId,
                movementType: movement.movementType,
                quantity: movement.quantity,
                notes: movement.notes ?? undefined,
                createdAt: movement.createdAt
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MOVEMENT_CREATE_ERROR',
                message: 'Stok hareketi oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getMovements(filter) {
        try {
            const movements = await this.stockRepository.getMovements(filter);
            return (0, interfaces_1.success)(movements.map((m) => ({
                id: m.id,
                stockItemId: m.stockItemId,
                movementType: m.movementType,
                quantity: m.quantity,
                notes: m.notes ?? undefined,
                createdAt: m.createdAt
            })));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MOVEMENTS_FETCH_ERROR',
                message: 'Stok hareketleri getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    toDto(item) {
        const materialDto = {
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
            stockType: item.stockType,
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
    validateCreateInput(data) {
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
    async publishEvent(eventType, aggregateId, payload) {
        if (!this.eventPublisher)
            return;
        const event = {
            eventId: crypto.randomUUID(),
            eventType,
            timestamp: new Date(),
            aggregateId,
            aggregateType: 'StockItem',
            payload
        };
        await this.eventPublisher.publish(event);
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.StockService = StockService;
//# sourceMappingURL=stock.service.js.map