"use strict";
/**
 * CuttingJob Repository
 * Following SRP - Only handles CuttingJob data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobRepository = void 0;
class CuttingJobRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.cuttingJob.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        orderItem: {
                            select: {
                                id: true,
                                itemCode: true,
                                itemName: true,
                                geometryType: true,
                                length: true,
                                width: true,
                                height: true,
                                quantity: true
                            }
                        }
                    }
                },
                scenarios: {
                    select: { id: true, name: true, status: true }
                },
                _count: { select: { items: true, scenarios: true } }
            }
        });
    }
    async findAll(filter) {
        const where = {};
        if (filter?.status)
            where.status = filter.status;
        if (filter?.materialTypeId)
            where.materialTypeId = filter.materialTypeId;
        if (filter?.thickness)
            where.thickness = filter.thickness;
        return this.prisma.cuttingJob.findMany({
            where: where,
            include: {
                items: {
                    include: {
                        orderItem: {
                            select: {
                                id: true,
                                itemCode: true,
                                itemName: true,
                                geometryType: true,
                                length: true,
                                width: true,
                                height: true,
                                quantity: true
                            }
                        }
                    }
                },
                _count: { select: { items: true, scenarios: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findByJobNumber(jobNumber) {
        return this.prisma.cuttingJob.findUnique({ where: { jobNumber } });
    }
    async create(materialTypeId, thickness, items) {
        const jobNumber = await this.generateJobNumber();
        return this.prisma.cuttingJob.create({
            data: {
                jobNumber,
                materialTypeId,
                thickness,
                status: 'PENDING',
                items: items ? {
                    create: items.map(item => ({
                        orderItemId: item.orderItemId,
                        quantity: item.quantity
                    }))
                } : undefined
            }
        });
    }
    async updateStatus(id, status) {
        return this.prisma.cuttingJob.update({
            where: { id },
            data: {
                status: status
            }
        });
    }
    async delete(id) {
        await this.prisma.cuttingJob.delete({ where: { id } });
    }
    async addItem(jobId, data) {
        return this.prisma.cuttingJobItem.create({
            data: {
                cuttingJobId: jobId,
                orderItemId: data.orderItemId,
                quantity: data.quantity
            }
        });
    }
    async removeItem(jobId, orderItemId) {
        await this.prisma.cuttingJobItem.delete({
            where: {
                cuttingJobId_orderItemId: {
                    cuttingJobId: jobId,
                    orderItemId
                }
            }
        });
    }
    async getItems(jobId) {
        return this.prisma.cuttingJobItem.findMany({
            where: { cuttingJobId: jobId }
        });
    }
    async findByMaterialAndThickness(materialTypeId, thickness, status) {
        return this.prisma.cuttingJob.findMany({
            where: {
                materialTypeId,
                thickness,
                ...(status && { status: status })
            },
            include: {
                items: {
                    include: {
                        orderItem: {
                            select: {
                                id: true,
                                itemCode: true,
                                itemName: true,
                                geometryType: true,
                                length: true,
                                width: true,
                                height: true,
                                quantity: true
                            }
                        }
                    }
                },
                _count: { select: { items: true, scenarios: true } }
            }
        });
    }
    async generateJobNumber() {
        const count = await this.prisma.cuttingJob.count();
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `JOB-${year}${month}-${String(count + 1).padStart(5, '0')}`;
    }
    async getOrderItemsByIds(ids) {
        const items = await this.prisma.orderItem.findMany({
            where: { id: { in: ids } },
            select: { id: true, quantity: true }
        });
        return items;
    }
    async getUnassignedOrderItems(confirmedOnly) {
        const items = await this.prisma.orderItem.findMany({
            where: {
                order: confirmedOnly ? { status: 'CONFIRMED' } : undefined,
                cuttingJobItems: { none: {} }
            },
            select: {
                id: true,
                materialTypeId: true,
                thickness: true,
                quantity: true
            }
        });
        return items;
    }
}
exports.CuttingJobRepository = CuttingJobRepository;
//# sourceMappingURL=cutting-job.repository.js.map