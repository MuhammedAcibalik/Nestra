"use strict";
/**
 * CuttingJob Service
 * Following SOLID principles with proper types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobService = void 0;
const interfaces_1 = require("../../core/interfaces");
const events_1 = require("../../core/events");
class CuttingJobService {
    repository;
    prisma;
    constructor(repository, prisma) {
        this.repository = repository;
        this.prisma = prisma;
    }
    async getJobs(filter) {
        try {
            const jobs = await this.repository.findAll(filter);
            const dtos = jobs.map(job => this.toDto(job));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOBS_FETCH_ERROR',
                message: 'Kesim işleri getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getJobById(id) {
        try {
            const job = await this.repository.findById(id);
            if (!job) {
                return (0, interfaces_1.failure)({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }
            return (0, interfaces_1.success)(this.toDto(job));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOB_FETCH_ERROR',
                message: 'Kesim işi getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async createJob(data) {
        try {
            // Get order items to determine quantities
            const orderItems = await this.prisma.orderItem.findMany({
                where: { id: { in: data.orderItemIds } }
            });
            const items = orderItems.map(item => ({
                orderItemId: item.id,
                quantity: item.quantity
            }));
            const job = await this.repository.create(data.materialTypeId, data.thickness, items);
            const fullJob = await this.repository.findById(job.id);
            // Publish cutting job created event
            const eventBus = events_1.EventBus.getInstance();
            await eventBus.publish(events_1.DomainEvents.cuttingJobCreated({
                jobId: job.id,
                jobNumber: job.jobNumber,
                materialTypeId: data.materialTypeId,
                thickness: data.thickness,
                itemCount: items.length
            }));
            return (0, interfaces_1.success)(this.toDto(fullJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOB_CREATE_ERROR',
                message: 'Kesim işi oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async updateJobStatus(id, status) {
        try {
            const job = await this.repository.findById(id);
            if (!job) {
                return (0, interfaces_1.failure)({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }
            // Validate status transition
            const validTransitions = {
                'PENDING': ['OPTIMIZING'],
                'OPTIMIZING': ['OPTIMIZED', 'PENDING'],
                'OPTIMIZED': ['IN_PRODUCTION', 'PENDING'],
                'IN_PRODUCTION': ['COMPLETED'],
                'COMPLETED': []
            };
            if (!validTransitions[job.status]?.includes(status)) {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_STATUS_TRANSITION',
                    message: `${job.status} durumundan ${status} durumuna geçiş yapılamaz`
                });
            }
            await this.repository.updateStatus(id, status);
            const updatedJob = await this.repository.findById(id);
            // Publish cutting job completed event if status changed to COMPLETED
            if (status === 'COMPLETED') {
                const eventBus = events_1.EventBus.getInstance();
                await eventBus.publish(events_1.DomainEvents.cuttingJobCompleted({
                    jobId: id,
                    jobNumber: updatedJob.jobNumber,
                    planCount: updatedJob._count?.scenarios ?? 0
                }));
            }
            return (0, interfaces_1.success)(this.toDto(updatedJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOB_UPDATE_ERROR',
                message: 'Kesim işi güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async deleteJob(id) {
        try {
            const job = await this.repository.findById(id);
            if (!job) {
                return (0, interfaces_1.failure)({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }
            if (job.status !== 'PENDING') {
                return (0, interfaces_1.failure)({
                    code: 'CANNOT_DELETE',
                    message: 'Sadece PENDING durumundaki işler silinebilir'
                });
            }
            await this.repository.delete(id);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOB_DELETE_ERROR',
                message: 'Kesim işi silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async autoGenerateFromOrders(confirmedOnly = true) {
        try {
            // Get order items that haven't been assigned to a cutting job yet
            const orderItems = await this.prisma.orderItem.findMany({
                where: {
                    order: confirmedOnly ? { status: 'CONFIRMED' } : undefined,
                    cuttingJobItems: { none: {} }
                },
                include: {
                    order: { select: { status: true } }
                }
            });
            // Group by materialTypeId and thickness
            const grouped = new Map();
            const skippedItems = [];
            for (const item of orderItems) {
                const key = `${item.materialTypeId}:${item.thickness}`;
                const existing = grouped.get(key) ?? [];
                existing.push(item);
                grouped.set(key, existing);
            }
            // Create jobs for each group
            const createdJobs = [];
            for (const [key, items] of Array.from(grouped)) {
                const [materialTypeId, thicknessStr] = key.split(':');
                const thickness = parseFloat(thicknessStr);
                // Check if a PENDING job already exists for this material/thickness
                const existingJobs = await this.repository.findByMaterialAndThickness(materialTypeId, thickness, 'PENDING');
                if (existingJobs.length > 0) {
                    // Add items to existing job
                    const existingJob = existingJobs[0];
                    for (const item of items) {
                        await this.repository.addItem(existingJob.id, {
                            orderItemId: item.id,
                            quantity: item.quantity
                        });
                    }
                    const updatedJob = await this.repository.findById(existingJob.id);
                    createdJobs.push(this.toDto(updatedJob));
                }
                else {
                    // Create new job
                    const job = await this.repository.create(materialTypeId, thickness, items.map(i => ({ orderItemId: i.id, quantity: i.quantity })));
                    const fullJob = await this.repository.findById(job.id);
                    createdJobs.push(this.toDto(fullJob));
                }
            }
            return (0, interfaces_1.success)({
                createdJobs,
                skippedItems
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'AUTO_GENERATE_ERROR',
                message: 'Otomatik iş oluşturma sırasında hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async addItemToJob(jobId, orderItemId, quantity) {
        try {
            const job = await this.repository.findById(jobId);
            if (!job) {
                return (0, interfaces_1.failure)({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }
            if (job.status !== 'PENDING') {
                return (0, interfaces_1.failure)({
                    code: 'JOB_NOT_PENDING',
                    message: 'Sadece PENDING durumundaki işlere parça eklenebilir'
                });
            }
            await this.repository.addItem(jobId, { orderItemId, quantity });
            const updatedJob = await this.repository.findById(jobId);
            return (0, interfaces_1.success)(this.toDto(updatedJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ADD_ITEM_ERROR',
                message: 'Parça eklenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async removeItemFromJob(jobId, orderItemId) {
        try {
            const job = await this.repository.findById(jobId);
            if (!job) {
                return (0, interfaces_1.failure)({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }
            if (job.status !== 'PENDING') {
                return (0, interfaces_1.failure)({
                    code: 'JOB_NOT_PENDING',
                    message: 'Sadece PENDING durumundaki işlerden parça çıkarılabilir'
                });
            }
            await this.repository.removeItem(jobId, orderItemId);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'REMOVE_ITEM_ERROR',
                message: 'Parça çıkarılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    toDto(job) {
        return {
            id: job.id,
            jobNumber: job.jobNumber,
            materialTypeId: job.materialTypeId,
            thickness: job.thickness,
            status: job.status,
            itemCount: job._count?.items ?? 0,
            scenarioCount: job._count?.scenarios ?? 0,
            createdAt: job.createdAt,
            items: job.items?.map(item => ({
                id: item.id,
                orderItemId: item.orderItemId,
                itemCode: item.orderItem?.itemCode ?? null,
                itemName: item.orderItem?.itemName ?? null,
                geometryType: item.orderItem?.geometryType ?? '',
                dimensions: {
                    length: item.orderItem?.length,
                    width: item.orderItem?.width,
                    height: item.orderItem?.height
                },
                quantity: item.quantity
            }))
        };
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.CuttingJobService = CuttingJobService;
//# sourceMappingURL=cutting-job.service.js.map