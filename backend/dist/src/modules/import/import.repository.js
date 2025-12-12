"use strict";
/**
 * Import Repository
 * Handles data access for import operations
 * Following SRP - Only handles import-related data queries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportRepository = void 0;
// ==================== REPOSITORY ====================
class ImportRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrderCount() {
        return this.prisma.order.count();
    }
    async createOrderWithItems(orderNumber, userId, notes, items) {
        const order = await this.prisma.order.create({
            data: {
                orderNumber,
                createdById: userId,
                notes,
                items: {
                    create: items.map(item => ({
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        geometryType: (item.geometryType || 'RECTANGLE'),
                        length: item.length,
                        width: item.width,
                        height: item.height,
                        diameter: item.diameter,
                        materialTypeId: item.materialTypeId,
                        thickness: item.thickness,
                        quantity: item.quantity,
                        canRotate: item.canRotate ?? true
                    }))
                }
            }
        });
        return {
            id: order.id,
            orderNumber: order.orderNumber
        };
    }
}
exports.ImportRepository = ImportRepository;
//# sourceMappingURL=import.repository.js.map