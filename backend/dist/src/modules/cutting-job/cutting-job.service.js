"use strict";
/**
 * CuttingJob Service
 * Following Single Responsibility Principle (SRP)
 * Core CRUD operations only
 * Generator and Operations are delegated to specialized services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobService = void 0;
const interfaces_1 = require("../../core/interfaces");
const events_1 = require("../../core/events");
const cutting_job_mapper_1 = require("./cutting-job.mapper");
const cutting_job_generator_service_1 = require("./cutting-job-generator.service");
const cutting_job_operations_service_1 = require("./cutting-job-operations.service");
/**
 * Status transition rules
 */
const STATUS_TRANSITIONS = {
    'PENDING': ['OPTIMIZING'],
    'OPTIMIZING': ['OPTIMIZED', 'PENDING'],
    'OPTIMIZED': ['IN_PRODUCTION', 'PENDING'],
    'IN_PRODUCTION': ['COMPLETED'],
    'COMPLETED': []
};
/**
 * CuttingJob Service Implementation
 * Composes generator and operations services
 */
class CuttingJobService {
    repository;
    generatorService;
    operationsService;
    constructor(repository, generatorService, operationsService) {
        this.repository = repository;
        // Allow injection for testing, use defaults otherwise
        this.generatorService = generatorService ?? new cutting_job_generator_service_1.CuttingJobGeneratorService(repository);
        this.operationsService = operationsService ?? new cutting_job_operations_service_1.CuttingJobOperationsService(repository);
    }
    // ==================== CORE CRUD OPERATIONS ====================
    async getJobs(filter) {
        try {
            const jobs = await this.repository.findAll(filter);
            const dtos = jobs.map(job => (0, cutting_job_mapper_1.toCuttingJobDto)(job));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOBS_FETCH_ERROR',
                message: 'Kesim işleri getirilirken hata oluştu',
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
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
            return (0, interfaces_1.success)((0, cutting_job_mapper_1.toCuttingJobDto)(job));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOB_FETCH_ERROR',
                message: 'Kesim işi getirilirken hata oluştu',
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async createJob(data) {
        try {
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
            return (0, interfaces_1.success)((0, cutting_job_mapper_1.toCuttingJobDto)(fullJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOB_CREATE_ERROR',
                message: 'Kesim işi oluşturulurken hata oluştu',
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
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
            if (!STATUS_TRANSITIONS[job.status]?.includes(status)) {
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
            return (0, interfaces_1.success)((0, cutting_job_mapper_1.toCuttingJobDto)(updatedJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'JOB_UPDATE_ERROR',
                message: 'Kesim işi güncellenirken hata oluştu',
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
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
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
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
            return (0, interfaces_1.success)((0, cutting_job_mapper_1.toCuttingJobDto)(updatedJob));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'ADD_ITEM_ERROR',
                message: 'Parça eklenirken hata oluştu',
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
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
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    // ==================== DELEGATED OPERATIONS ====================
    async autoGenerateFromOrders(confirmedOnly = true) {
        return this.generatorService.autoGenerateFromOrders(confirmedOnly);
    }
    async mergeJobs(sourceJobIds, targetJobId) {
        return this.operationsService.mergeJobs(sourceJobIds, targetJobId);
    }
    async splitJob(jobId, itemsToSplit) {
        return this.operationsService.splitJob(jobId, itemsToSplit);
    }
}
exports.CuttingJobService = CuttingJobService;
//# sourceMappingURL=cutting-job.service.js.map