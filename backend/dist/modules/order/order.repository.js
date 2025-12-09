"use strict";
/**
 * Order Repository
 * Following SRP - Only handles order data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
class OrderRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, code: true, name: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                items: true
            }
        });
    }
    async findAll(filter) {
        const where = {};
        if (filter?.status)
            where.status = filter.status;
        if (filter?.customerId)
            where.customerId = filter.customerId;
        if (filter?.startDate || filter?.endDate) {
            where.createdAt = {};
            if (filter.startDate)
                where.createdAt.gte = filter.startDate;
            if (filter.endDate)
                where.createdAt.lte = filter.endDate;
        }
        return this.prisma.order.findMany({
            where: where,
            include: {
                customer: { select: { id: true, code: true, name: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findByNumber(orderNumber) {
        return this.prisma.order.findUnique({ where: { orderNumber } });
    }
    async create(data, userId) {
        const orderNumber = await this.generateOrderNumber();
        return this.prisma.order.create({
            data: {
                orderNumber,
                customerId: data.customerId,
                createdById: userId,
                priority: data.priority ?? 5,
                dueDate: data.dueDate,
                notes: data.notes,
                items: data.items ? {
                    create: data.items.map((item) => ({
                        itemCode: item.itemCode,
                        itemName: item.itemName,
                        geometryType: item.geometryType,
                        length: item.length,
                        width: item.width,
                        height: item.height,
                        diameter: item.diameter,
                        materialTypeId: item.materialTypeId,
                        thickness: item.thickness,
                        quantity: item.quantity,
                        canRotate: item.canRotate ?? true
                    }))
                } : undefined
            }
        });
    }
    async update(id, data) {
        return this.prisma.order.update({
            where: { id },
            data: {
                customerId: data.customerId,
                priority: data.priority,
                dueDate: data.dueDate,
                notes: data.notes,
                status: data.status
            }
        });
    }
    async delete(id) {
        await this.prisma.order.delete({ where: { id } });
    }
    async addItem(orderId, data) {
        return this.prisma.orderItem.create({
            data: {
                orderId,
                itemCode: data.itemCode,
                itemName: data.itemName,
                geometryType: data.geometryType,
                length: data.length,
                width: data.width,
                height: data.height,
                diameter: data.diameter,
                materialTypeId: data.materialTypeId,
                thickness: data.thickness,
                quantity: data.quantity,
                canRotate: data.canRotate ?? true
            }
        });
    }
    async getItems(orderId) {
        return this.prisma.orderItem.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' }
        });
    }
    async generateOrderNumber() {
        const count = await this.prisma.order.count();
        return `ORD-${String(count + 1).padStart(6, '0')}`;
    }
}
exports.OrderRepository = OrderRepository;
//# sourceMappingURL=order.repository.js.map