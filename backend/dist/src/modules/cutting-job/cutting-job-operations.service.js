"use strict";
/**
 * CuttingJob Operations Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for merge and split operations only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobOperationsService = void 0;
const interfaces_1 = require("../../core/interfaces");
const cutting_job_mapper_1 = require("./cutting-job.mapper");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('CuttingJobOperations');
/**
 * CuttingJob Operations Service Implementation
 */
class CuttingJobOperationsService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
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
            const validationError = this.validateMaterialAndThickness(sourceJobs);
            if (validationError) {
                return validationError;
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
                await this.repository.addItem(targetId, {
                    orderItemId: item.orderItemId,
                    quantity: item.quantity
                });
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
            logger.info('Merged jobs', { targetId, mergedFrom: jobsToDelete });
            return (0, interfaces_1.success)((0, cutting_job_mapper_1.toCuttingJobDto)(mergedJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MERGE_ERROR',
                message: 'İş birleştirme hatası',
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
            });
        }
    }
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
            const validationError = this.validateSplitItems(sourceItems, itemsToSplit);
            if (validationError) {
                return validationError;
            }
            // Create new job with same material type and thickness
            const newJob = await this.repository.create({
                materialTypeId: sourceJob.materialTypeId,
                thickness: sourceJob.thickness
            });
            // Move items to new job
            await this.moveItemsToNewJob(jobId, newJob.id, sourceItems, itemsToSplit);
            // Fetch the new job with items
            const createdJob = await this.repository.findById(newJob.id);
            if (!createdJob) {
                return (0, interfaces_1.failure)({
                    code: 'SPLIT_ERROR',
                    message: 'Bölme sonrası yeni iş bulunamadı'
                });
            }
            logger.info('Split job', { newJobId: newJob.id, splitFrom: jobId });
            return (0, interfaces_1.success)((0, cutting_job_mapper_1.toCuttingJobDto)(createdJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'SPLIT_ERROR',
                message: 'İş bölme hatası',
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    /**
     * Validate that all jobs have the same material type and thickness
     */
    validateMaterialAndThickness(jobs) {
        const firstJob = jobs[0];
        for (const job of jobs) {
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
        return null;
    }
    /**
     * Validate split items exist and quantities are valid
     */
    validateSplitItems(sourceItems, itemsToSplit) {
        for (const splitItem of itemsToSplit) {
            const sourceItem = sourceItems.find(i => i.id === splitItem.itemId);
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
                    details: {
                        itemId: splitItem.itemId,
                        available: sourceItem.quantity,
                        requested: splitItem.quantity
                    }
                });
            }
        }
        return null;
    }
    /**
     * Move items from source job to new job
     */
    async moveItemsToNewJob(sourceJobId, newJobId, sourceItems, itemsToSplit) {
        for (const splitItem of itemsToSplit) {
            const sourceItem = sourceItems.find(i => i.id === splitItem.itemId);
            // Add to new job
            await this.repository.addItem(newJobId, {
                orderItemId: sourceItem.orderItemId,
                quantity: splitItem.quantity
            });
            // Reduce or remove from source job
            const remainingQty = sourceItem.quantity - splitItem.quantity;
            if (remainingQty <= 0) {
                await this.repository.removeItem(sourceJobId, sourceItem.orderItemId);
            }
            else {
                // Update quantity in source job (reduce by split amount)
                await this.repository.removeItem(sourceJobId, sourceItem.orderItemId);
                await this.repository.addItem(sourceJobId, {
                    orderItemId: sourceItem.orderItemId,
                    quantity: remainingQty
                });
            }
        }
    }
}
exports.CuttingJobOperationsService = CuttingJobOperationsService;
//# sourceMappingURL=cutting-job-operations.service.js.map