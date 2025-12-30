"use strict";
/**
 * CuttingJob Service Handler
 * Exposes cutting-job module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobServiceHandler = void 0;
// ==================== SERVICE HANDLER ====================
class CuttingJobServiceHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        const { method, path, data } = request;
        // Route: GET /cutting-jobs/:id
        if (method === 'GET' && /^\/cutting-jobs\/[\w-]+$/.exec(path)) {
            const jobId = path.split('/')[2];
            return this.getJobById(jobId);
        }
        // Route: GET /cutting-jobs/:id/with-items (for Optimization)
        if (method === 'GET' && /^\/cutting-jobs\/[\w-]+\/with-items$/.exec(path)) {
            const jobId = path.split('/')[2];
            return this.getJobWithItems(jobId);
        }
        // Route: GET /cutting-jobs
        if (method === 'GET' && path === '/cutting-jobs') {
            return this.getAllJobs();
        }
        // Route: GET /cutting-jobs/pending
        if (method === 'GET' && path === '/cutting-jobs/pending') {
            return this.getPendingJobs();
        }
        // Route: PUT /cutting-jobs/:id/status
        if (method === 'PUT' && /^\/cutting-jobs\/[\w-]+\/status$/.exec(path)) {
            const jobId = path.split('/')[2];
            const { status } = data;
            return this.updateStatus(jobId, status);
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getJobWithItems(jobId) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getJobById(jobId) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getAllJobs() {
        try {
            const jobs = await this.repository.findAll();
            return {
                success: true,
                data: jobs.map((j) => this.toSummary(j))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getPendingJobs() {
        try {
            const jobs = await this.repository.findAll({ status: 'PENDING' });
            return {
                success: true,
                data: jobs.map((j) => this.toSummary(j))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async updateStatus(jobId, status) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    toSummary(job) {
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
exports.CuttingJobServiceHandler = CuttingJobServiceHandler;
//# sourceMappingURL=cutting-job.service-handler.js.map