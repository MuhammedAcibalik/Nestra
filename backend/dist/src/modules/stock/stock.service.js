"use strict";
/**
 * Stock Service
 * Following SOLID principles:
 * - SRP: Only handles stock business logic
 * - DIP: Depends on IStockRepository abstraction
 * - OCP: Open for extension via new movement types
 *
 * Core CRUD and movement operations - delegates alerts to sub-service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockService = void 0;
const interfaces_1 = require("../../core/interfaces");
const stock_mapper_1 = require("./stock.mapper");
const stock_alert_service_1 = require("./stock-alert.service");
const POSITIVE_MOVEMENT_TYPES = ['PURCHASE', 'WASTE_REUSE', 'ADJUSTMENT'];
class StockService {
    stockRepository;
    eventPublisher;
    alertService;
    constructor(stockRepository, eventPublisher, alertService) {
        this.stockRepository = stockRepository;
        this.eventPublisher = eventPublisher;
        this.alertService = alertService ?? new stock_alert_service_1.StockAlertService(stockRepository);
    }
    // ==================== CORE CRUD OPERATIONS ====================
    async getStockItems(filter) {
        try {
            const items = await this.stockRepository.findAll(filter);
            const dtos = items.map((item) => (0, stock_mapper_1.toStockItemDto)(item));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_FETCH_ERROR',
                message: 'Stok kalemleri getirilirken hata oluştu',
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
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
            return (0, interfaces_1.success)((0, stock_mapper_1.toStockItemDto)(item));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_FETCH_ERROR',
                message: 'Stok kalemi getirilirken hata oluştu',
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async createStockItem(data) {
        try {
            const validationError = (0, stock_mapper_1.validateCreateInput)(data);
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
            return (0, interfaces_1.success)((0, stock_mapper_1.toStockItemDto)(fullItem));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_CREATE_ERROR',
                message: 'Stok kalemi oluşturulurken hata oluştu',
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
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
            return (0, interfaces_1.success)((0, stock_mapper_1.toStockItemDto)(fullItem));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_UPDATE_ERROR',
                message: 'Stok kalemi güncellenirken hata oluştu',
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
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
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    // ==================== MOVEMENT OPERATIONS ====================
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
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
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
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    // ==================== WASTE PIECE REGISTRATION ====================
    async registerWastePiece(data) {
        try {
            const sourceStock = await this.stockRepository.findById(data.sourceStockItemId);
            if (!sourceStock) {
                return (0, interfaces_1.failure)({
                    code: 'SOURCE_NOT_FOUND',
                    message: 'Kaynak stok kalemi bulunamadı'
                });
            }
            const wasteCode = (0, stock_mapper_1.generateWasteCode)(sourceStock.code);
            const stockType = (0, stock_mapper_1.determineStockType)(data.length, data.width, data.height);
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
            return (0, interfaces_1.success)((0, stock_mapper_1.toStockItemDto)(fullItem));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'WASTE_REGISTER_ERROR',
                message: 'Fire parçası kaydedilirken hata oluştu',
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    // ==================== DELEGATED OPERATIONS ====================
    async checkAndNotifyLowStock() {
        return this.alertService.checkAndNotifyLowStock();
    }
    async getLowStockItems(threshold = 5) {
        return this.alertService.getLowStockItems(threshold);
    }
    // ==================== PRIVATE HELPERS ====================
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
}
exports.StockService = StockService;
//# sourceMappingURL=stock.service.js.map