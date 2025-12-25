/**
 * CuttingJob Service Handler
 * Exposes cutting-job module as internal service
 * Following ISP - only exposes operations needed by other modules
 */

import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { ICuttingJobRepository, CuttingJobWithRelations } from './cutting-job.repository';

// ==================== INTERFACES ====================

export interface ICuttingJobSummary {
    id: string;
    jobNumber: string;
    materialTypeId: string;
    thickness: number;
    status: string;
    itemCount: number;
}

// ==================== SERVICE HANDLER ====================

export class CuttingJobServiceHandler implements IServiceHandler {
    constructor(private readonly repository: ICuttingJobRepository) {}

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path, data } = request;

        // Route: GET /cutting-jobs/:id
        if (method === 'GET' && /^\/cutting-jobs\/[\w-]+$/.exec(path)) {
            const jobId = path.split('/')[2];
            return this.getJobById(jobId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /cutting-jobs/:id/with-items (for Optimization)
        if (method === 'GET' && /^\/cutting-jobs\/[\w-]+\/with-items$/.exec(path)) {
            const jobId = path.split('/')[2];
            return this.getJobWithItems(jobId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /cutting-jobs
        if (method === 'GET' && path === '/cutting-jobs') {
            return this.getAllJobs() as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /cutting-jobs/pending
        if (method === 'GET' && path === '/cutting-jobs/pending') {
            return this.getPendingJobs() as Promise<IServiceResponse<TRes>>;
        }

        // Route: PUT /cutting-jobs/:id/status
        if (method === 'PUT' && /^\/cutting-jobs\/[\w-]+\/status$/.exec(path)) {
            const jobId = path.split('/')[2];
            const { status } = data as { status: string };
            return this.updateStatus(jobId, status) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getJobWithItems(jobId: string): Promise<IServiceResponse<unknown>> {
        try {
            const job = await this.repository.findById(jobId);

            if (!job) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Cutting job not found' }
                };
            }

            // Transform to ICuttingJobWithItems format for OptimizationEngine
            return {
                success: true,
                data: {
                    id: job.id,
                    jobNumber: job.jobNumber,
                    materialTypeId: job.materialTypeId,
                    thickness: job.thickness,
                    status: job.status,
                    items: (job.items ?? []).map((item) => ({
                        id: item.id,
                        orderItemId: item.orderItemId,
                        quantity: item.quantity,
                        orderItem: item.orderItem
                            ? {
                                  geometryType: item.orderItem.geometryType,
                                  length: item.orderItem.length,
                                  width: item.orderItem.width,
                                  height: item.orderItem.height
                              }
                            : null
                    }))
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getJobById(jobId: string): Promise<IServiceResponse<ICuttingJobSummary>> {
        try {
            const job = await this.repository.findById(jobId);

            if (!job) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Cutting job not found' }
                };
            }

            return {
                success: true,
                data: this.toSummary(job)
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getAllJobs(): Promise<IServiceResponse<ICuttingJobSummary[]>> {
        try {
            const jobs = await this.repository.findAll();

            return {
                success: true,
                data: jobs.map((j) => this.toSummary(j))
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getPendingJobs(): Promise<IServiceResponse<ICuttingJobSummary[]>> {
        try {
            const jobs = await this.repository.findAll({ status: 'PENDING' });

            return {
                success: true,
                data: jobs.map((j) => this.toSummary(j))
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async updateStatus(jobId: string, status: string): Promise<IServiceResponse<ICuttingJobSummary>> {
        try {
            await this.repository.updateStatus(jobId, status);
            const job = await this.repository.findById(jobId);

            if (!job) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Cutting job not found' }
                };
            }

            return {
                success: true,
                data: this.toSummary(job)
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private toSummary(job: CuttingJobWithRelations): ICuttingJobSummary {
        return {
            id: job.id,
            jobNumber: job.jobNumber,
            materialTypeId: job.materialTypeId,
            thickness: job.thickness,
            status: job.status,
            itemCount: job._count?.items ?? 0
        };
    }
}
