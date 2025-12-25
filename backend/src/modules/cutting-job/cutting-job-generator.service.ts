/**
 * CuttingJob Generator Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for auto-generating cutting jobs from orders
 */

import { IResult, success, failure } from '../../core/interfaces';
import { ICuttingJobRepository } from './cutting-job.repository';
import { ICuttingJobDto, IAutoGenerateResult, toCuttingJobDto, getErrorMessage } from './cutting-job.mapper';

/**
 * CuttingJob Generator Service Interface
 * Following Interface Segregation Principle (ISP)
 */
export interface ICuttingJobGeneratorService {
    autoGenerateFromOrders(confirmedOnly?: boolean): Promise<IResult<IAutoGenerateResult>>;
}

/**
 * CuttingJob Generator Service Implementation
 */
export class CuttingJobGeneratorService implements ICuttingJobGeneratorService {
    constructor(private readonly repository: ICuttingJobRepository) { }

    /**
     * Auto-generate cutting jobs from unassigned order items
     * Groups items by material type and thickness
     */
    async autoGenerateFromOrders(confirmedOnly = true): Promise<IResult<IAutoGenerateResult>> {
        try {
            // Get order items that haven't been assigned to a cutting job yet
            const orderItems = await this.repository.getUnassignedOrderItems(confirmedOnly);

            // Group by materialTypeId and thickness
            const grouped = new Map<string, typeof orderItems>();
            const skippedItems: { orderItemId: string; reason: string }[] = [];

            for (const item of orderItems) {
                const key = `${item.materialTypeId}:${item.thickness}`;
                const existing = grouped.get(key) ?? [];
                existing.push(item);
                grouped.set(key, existing);
            }

            // Create jobs for each group
            const createdJobs: ICuttingJobDto[] = [];

            for (const [key, items] of Array.from(grouped)) {
                const [materialTypeId, thicknessStr] = key.split(':');
                const thickness = Number.parseFloat(thicknessStr);

                // Check if a PENDING job already exists for this material/thickness
                const existingJobs = await this.repository.findByMaterialAndThickness(
                    materialTypeId,
                    thickness,
                    'PENDING'
                );

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
                    createdJobs.push(toCuttingJobDto(updatedJob!));
                } else {
                    // Create new job
                    const job = await this.repository.create({
                        materialTypeId,
                        thickness,
                        orderItemIds: items.map(i => i.id)
                    });
                    const fullJob = await this.repository.findById(job.id);
                    createdJobs.push(toCuttingJobDto(fullJob!));
                }
            }

            return success({
                createdJobs,
                skippedItems
            });
        } catch (error) {
            return failure({
                code: 'AUTO_GENERATE_ERROR',
                message: 'Otomatik iş oluşturma sırasında hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }
}
