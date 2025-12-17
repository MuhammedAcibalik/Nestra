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
    constructor(repository) {
        this.repository = repository;
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
            // Create the job with order item IDs
            const job = await this.repository.create({
                materialTypeId: data.materialTypeId,
                thickness: data.thickness,
                orderItemIds: data.orderItemIds
            });
            const fullJob = await this.repository.findById(job.id);
            // Publish cutting job created event
            const eventBus = events_1.EventBus.getInstance();
            await eventBus.publish(events_1.DomainEvents.cuttingJobCreated({
                jobId: job.id,
                jobNumber: job.jobNumber,
                materialTypeId: data.materialTypeId,
                thickness: data.thickness,
                itemCount: data.orderItemIds?.length ?? 0
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
            // Get order items that haven't been assigned to a cutting job yet using repository
            const orderItems = await this.repository.getUnassignedOrderItems(confirmedOnly);
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
                const thickness = Number.parseFloat(thicknessStr);
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
                    const job = await this.repository.create({
                        materialTypeId,
                        thickness,
                        orderItemIds: items.map(i => i.id)
                    });
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
    // ==================== JOB MERGING ====================
    /**
     * Merge multiple jobs into one
     * All items from source jobs will be moved to target job
     * Source jobs will be deleted after merge
     */
    async mergeJobs(sourceJobIds, targetJobId) {
        try {
            if (sourceJobIds.length < 2) {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_MERGE',
                    message: 'En az 2 iş birleştirilmeli',
                    details: { count: sourceJobIds.length }
                });
            }
            // Get all source jobs
            const sourceJobs = [];
            for (const jobId of sourceJobIds) {
                const job = await this.repository.findById(jobId);
                if (!job) {
                    return (0, interfaces_1.failure)({
                        code: 'JOB_NOT_FOUND',
                        message: `İş bulunamadı: ${jobId}`,
                        details: { jobId }
                    });
                }
                if (job.status !== 'PENDING') {
                    return (0, interfaces_1.failure)({
                        code: 'INVALID_STATUS',
                        message: 'Sadece bekleyen işler birleştirilebilir',
                        details: { jobId, status: job.status }
                    });
                }
                sourceJobs.push(job);
            }
            // Validate same material type and thickness
            const firstJob = sourceJobs[0];
            for (const job of sourceJobs) {
                if (job.materialTypeId !== firstJob.materialTypeId) {
                    return (0, interfaces_1.failure)({
                        code: 'MATERIAL_MISMATCH',
                        message: 'Tüm işler aynı malzeme tipinde olmalı',
                        details: { expected: firstJob.materialTypeId, found: job.materialTypeId }
                    });
                }
                if (job.thickness !== firstJob.thickness) {
                    return (0, interfaces_1.failure)({
                        code: 'THICKNESS_MISMATCH',
                        message: 'Tüm işler aynı kalınlıkta olmalı',
                        details: { expected: firstJob.thickness, found: job.thickness }
                    });
                }
            }
            // Determine target job (use provided or first source)
            const targetId = targetJobId ?? sourceJobIds[0];
            const targetJob = sourceJobs.find(j => j.id === targetId);
            if (!targetJob) {
                return (0, interfaces_1.failure)({
                    code: 'TARGET_NOT_FOUND',
                    message: 'Hedef iş bulunamadı',
                    details: { targetId }
                });
            }
            // Collect all items from other source jobs
            const itemsToMove = [];
            const jobsToDelete = [];
            for (const job of sourceJobs) {
                if (job.id === targetId)
                    continue;
                if (job.items) {
                    for (const item of job.items) {
                        itemsToMove.push({
                            orderItemId: item.orderItemId,
                            quantity: item.quantity
                        });
                    }
                }
                jobsToDelete.push(job.id);
            }
            // Add items to target job
            for (const item of itemsToMove) {
                await this.repository.addItem(targetId, { orderItemId: item.orderItemId, quantity: item.quantity });
            }
            // Delete source jobs (except target)
            for (const jobId of jobsToDelete) {
                await this.repository.delete(jobId);
            }
            // Fetch updated target job
            const mergedJob = await this.repository.findById(targetId);
            if (!mergedJob) {
                return (0, interfaces_1.failure)({
                    code: 'MERGE_ERROR',
                    message: 'Birleştirme sonrası iş bulunamadı'
                });
            }
            console.log('[CuttingJob] Merged jobs:', { targetId, mergedFrom: jobsToDelete });
            return (0, interfaces_1.success)(this.toDto(mergedJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MERGE_ERROR',
                message: 'İş birleştirme hatası',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    // ==================== JOB SPLITTING ====================
    /**
     * Split a job by moving specified items to a new job
     * Returns the newly created job
     */
    async splitJob(jobId, itemsToSplit) {
        try {
            if (itemsToSplit.length === 0) {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_SPLIT',
                    message: 'Bölünecek en az bir öğe belirtilmeli'
                });
            }
            // Get source job
            const sourceJob = await this.repository.findById(jobId);
            if (!sourceJob) {
                return (0, interfaces_1.failure)({
                    code: 'JOB_NOT_FOUND',
                    message: 'İş bulunamadı',
                    details: { jobId }
                });
            }
            if (sourceJob.status !== 'PENDING') {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_STATUS',
                    message: 'Sadece bekleyen işler bölünebilir',
                    details: { status: sourceJob.status }
                });
            }
            // Validate items exist and quantities
            const sourceItems = sourceJob.items ?? [];
            for (const splitItem of itemsToSplit) {
                const sourceItem = sourceItems.find((i) => i.id === splitItem.itemId);
                if (!sourceItem) {
                    return (0, interfaces_1.failure)({
                        code: 'ITEM_NOT_FOUND',
                        message: `Öğe bulunamadı: ${splitItem.itemId}`,
                        details: { itemId: splitItem.itemId }
                    });
                }
                if (splitItem.quantity > sourceItem.quantity) {
                    return (0, interfaces_1.failure)({
                        code: 'INVALID_QUANTITY',
                        message: 'Bölünecek miktar mevcut miktardan fazla olamaz',
                        details: { itemId: splitItem.itemId, available: sourceItem.quantity, requested: splitItem.quantity }
                    });
                }
            }
            // Create new job with same material type and thickness
            const newJob = await this.repository.create({
                materialTypeId: sourceJob.materialTypeId,
                thickness: sourceJob.thickness
            });
            // Move items to new job
            for (const splitItem of itemsToSplit) {
                const sourceItem = sourceItems.find((i) => i.id === splitItem.itemId);
                // Add to new job
                await this.repository.addItem(newJob.id, { orderItemId: sourceItem.orderItemId, quantity: splitItem.quantity });
                // Reduce or remove from source job
                const remainingQty = sourceItem.quantity - splitItem.quantity;
                if (remainingQty <= 0) {
                    await this.repository.removeItem(jobId, sourceItem.orderItemId);
                }
                else {
                    // Update quantity in source job (reduce by split amount)
                    await this.repository.removeItem(jobId, sourceItem.orderItemId);
                    await this.repository.addItem(jobId, { orderItemId: sourceItem.orderItemId, quantity: remainingQty });
                }
            }
            // Fetch the new job with items
            const createdJob = await this.repository.findById(newJob.id);
            if (!createdJob) {
                return (0, interfaces_1.failure)({
                    code: 'SPLIT_ERROR',
                    message: 'Bölme sonrası yeni iş bulunamadı'
                });
            }
            console.log('[CuttingJob] Split job:', { newJobId: newJob.id, splitFrom: jobId });
            return (0, interfaces_1.success)(this.toDto(createdJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'SPLIT_ERROR',
                message: 'İş bölme hatası',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
}
exports.CuttingJobService = CuttingJobService;
//# sourceMappingURL=cutting-job.service.js.map