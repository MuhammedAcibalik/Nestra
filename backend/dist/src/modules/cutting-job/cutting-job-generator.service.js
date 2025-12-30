"use strict";
/**
 * CuttingJob Generator Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for auto-generating cutting jobs from orders
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobGeneratorService = void 0;
const interfaces_1 = require("../../core/interfaces");
const cutting_job_mapper_1 = require("./cutting-job.mapper");
/**
 * CuttingJob Generator Service Implementation
 */
class CuttingJobGeneratorService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Auto-generate cutting jobs from unassigned order items
     * Groups items by material type and thickness
     */
    async autoGenerateFromOrders(confirmedOnly = true) {
        try {
            // Get order items that haven't been assigned to a cutting job yet
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
                    createdJobs.push((0, cutting_job_mapper_1.toCuttingJobDto)(updatedJob));
                }
                else {
                    // Create new job
                    const job = await this.repository.create({
                        materialTypeId,
                        thickness,
                        orderItemIds: items.map((i) => i.id)
                    });
                    const fullJob = await this.repository.findById(job.id);
                    createdJobs.push((0, cutting_job_mapper_1.toCuttingJobDto)(fullJob));
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
                details: { error: (0, cutting_job_mapper_1.getErrorMessage)(error) }
            });
        }
    }
}
exports.CuttingJobGeneratorService = CuttingJobGeneratorService;
//# sourceMappingURL=cutting-job-generator.service.js.map