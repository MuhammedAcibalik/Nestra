/**
 * CuttingJob Service
 * Following Single Responsibility Principle (SRP)
 * Core CRUD operations only
 * Generator and Operations are delegated to specialized services
 */

import { IResult, success, failure } from '../../core/interfaces';
import { ICuttingJobRepository, ICreateCuttingJobInput, ICuttingJobFilter } from './cutting-job.repository';
import { EventBus, DomainEvents } from '../../core/events';
import { ICuttingJobDto, IAutoGenerateResult, toCuttingJobDto, getErrorMessage } from './cutting-job.mapper';
import { ICuttingJobGeneratorService, CuttingJobGeneratorService } from './cutting-job-generator.service';
import { ICuttingJobOperationsService, CuttingJobOperationsService } from './cutting-job-operations.service';

// Re-export DTOs for backwards compatibility
export { ICuttingJobDto, ICuttingJobItemDto, IAutoGenerateResult, ISplitJobInput } from './cutting-job.mapper';

/**
 * CuttingJob Service Interface
 */
export interface ICuttingJobService {
    getJobs(filter?: ICuttingJobFilter): Promise<IResult<ICuttingJobDto[]>>;
    getJobById(id: string): Promise<IResult<ICuttingJobDto>>;
    createJob(data: ICreateCuttingJobInput): Promise<IResult<ICuttingJobDto>>;
    updateJobStatus(id: string, status: string): Promise<IResult<ICuttingJobDto>>;
    deleteJob(id: string): Promise<IResult<void>>;
    autoGenerateFromOrders(confirmedOnly?: boolean): Promise<IResult<IAutoGenerateResult>>;
    addItemToJob(jobId: string, orderItemId: string, quantity: number): Promise<IResult<ICuttingJobDto>>;
    removeItemFromJob(jobId: string, orderItemId: string): Promise<IResult<void>>;
    mergeJobs(sourceJobIds: string[], targetJobId?: string): Promise<IResult<ICuttingJobDto>>;
    splitJob(jobId: string, itemsToSplit: { itemId: string; quantity: number }[]): Promise<IResult<ICuttingJobDto>>;
}

/**
 * Status transition rules
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['OPTIMIZING'],
    OPTIMIZING: ['OPTIMIZED', 'PENDING'],
    OPTIMIZED: ['IN_PRODUCTION', 'PENDING'],
    IN_PRODUCTION: ['COMPLETED'],
    COMPLETED: []
};

/**
 * CuttingJob Service Implementation
 * Composes generator and operations services
 */
export class CuttingJobService implements ICuttingJobService {
    private readonly generatorService: ICuttingJobGeneratorService;
    private readonly operationsService: ICuttingJobOperationsService;

    constructor(
        private readonly repository: ICuttingJobRepository,
        generatorService?: ICuttingJobGeneratorService,
        operationsService?: ICuttingJobOperationsService
    ) {
        // Allow injection for testing, use defaults otherwise
        this.generatorService = generatorService ?? new CuttingJobGeneratorService(repository);
        this.operationsService = operationsService ?? new CuttingJobOperationsService(repository);
    }

    // ==================== CORE CRUD OPERATIONS ====================

    async getJobs(filter?: ICuttingJobFilter): Promise<IResult<ICuttingJobDto[]>> {
        try {
            const jobs = await this.repository.findAll(filter);
            const dtos = jobs.map((job) => toCuttingJobDto(job));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'JOBS_FETCH_ERROR',
                message: 'Kesim işleri getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getJobById(id: string): Promise<IResult<ICuttingJobDto>> {
        try {
            const job = await this.repository.findById(id);
            if (!job) {
                return failure({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }
            return success(toCuttingJobDto(job));
        } catch (error) {
            return failure({
                code: 'JOB_FETCH_ERROR',
                message: 'Kesim işi getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async createJob(data: ICreateCuttingJobInput): Promise<IResult<ICuttingJobDto>> {
        try {
            const job = await this.repository.create({
                materialTypeId: data.materialTypeId,
                thickness: data.thickness,
                orderItemIds: data.orderItemIds
            });

            const fullJob = await this.repository.findById(job.id);

            // Publish cutting job created event
            const eventBus = EventBus.getInstance();
            await eventBus.publish(
                DomainEvents.cuttingJobCreated({
                    jobId: job.id,
                    jobNumber: job.jobNumber,
                    materialTypeId: data.materialTypeId,
                    thickness: data.thickness,
                    itemCount: data.orderItemIds?.length ?? 0
                })
            );

            return success(toCuttingJobDto(fullJob!));
        } catch (error) {
            return failure({
                code: 'JOB_CREATE_ERROR',
                message: 'Kesim işi oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async updateJobStatus(id: string, status: string): Promise<IResult<ICuttingJobDto>> {
        try {
            const job = await this.repository.findById(id);
            if (!job) {
                return failure({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }

            // Validate status transition
            if (!STATUS_TRANSITIONS[job.status]?.includes(status)) {
                return failure({
                    code: 'INVALID_STATUS_TRANSITION',
                    message: `${job.status} durumundan ${status} durumuna geçiş yapılamaz`
                });
            }

            await this.repository.updateStatus(id, status);
            const updatedJob = await this.repository.findById(id);

            // Publish cutting job completed event if status changed to COMPLETED
            if (status === 'COMPLETED') {
                const eventBus = EventBus.getInstance();
                await eventBus.publish(
                    DomainEvents.cuttingJobCompleted({
                        jobId: id,
                        jobNumber: updatedJob!.jobNumber,
                        planCount: updatedJob!._count?.scenarios ?? 0
                    })
                );
            }

            return success(toCuttingJobDto(updatedJob!));
        } catch (error) {
            return failure({
                code: 'JOB_UPDATE_ERROR',
                message: 'Kesim işi güncellenirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async deleteJob(id: string): Promise<IResult<void>> {
        try {
            const job = await this.repository.findById(id);
            if (!job) {
                return failure({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }

            if (job.status !== 'PENDING') {
                return failure({
                    code: 'CANNOT_DELETE',
                    message: 'Sadece PENDING durumundaki işler silinebilir'
                });
            }

            await this.repository.delete(id);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'JOB_DELETE_ERROR',
                message: 'Kesim işi silinirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async addItemToJob(jobId: string, orderItemId: string, quantity: number): Promise<IResult<ICuttingJobDto>> {
        try {
            const job = await this.repository.findById(jobId);
            if (!job) {
                return failure({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }

            if (job.status !== 'PENDING') {
                return failure({
                    code: 'JOB_NOT_PENDING',
                    message: 'Sadece PENDING durumundaki işlere parça eklenebilir'
                });
            }

            await this.repository.addItem(jobId, { orderItemId, quantity });
            const updatedJob = await this.repository.findById(jobId);
            return success(toCuttingJobDto(updatedJob!));
        } catch (error) {
            return failure({
                code: 'ADD_ITEM_ERROR',
                message: 'Parça eklenirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async removeItemFromJob(jobId: string, orderItemId: string): Promise<IResult<void>> {
        try {
            const job = await this.repository.findById(jobId);
            if (!job) {
                return failure({
                    code: 'JOB_NOT_FOUND',
                    message: 'Kesim işi bulunamadı'
                });
            }

            if (job.status !== 'PENDING') {
                return failure({
                    code: 'JOB_NOT_PENDING',
                    message: 'Sadece PENDING durumundaki işlerden parça çıkarılabilir'
                });
            }

            await this.repository.removeItem(jobId, orderItemId);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'REMOVE_ITEM_ERROR',
                message: 'Parça çıkarılırken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    // ==================== DELEGATED OPERATIONS ====================

    async autoGenerateFromOrders(confirmedOnly = true): Promise<IResult<IAutoGenerateResult>> {
        return this.generatorService.autoGenerateFromOrders(confirmedOnly);
    }

    async mergeJobs(sourceJobIds: string[], targetJobId?: string): Promise<IResult<ICuttingJobDto>> {
        return this.operationsService.mergeJobs(sourceJobIds, targetJobId);
    }

    async splitJob(
        jobId: string,
        itemsToSplit: { itemId: string; quantity: number }[]
    ): Promise<IResult<ICuttingJobDto>> {
        return this.operationsService.splitJob(jobId, itemsToSplit);
    }
}
