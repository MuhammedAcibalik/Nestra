/**
 * Cutting Job Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { cuttingJobs, cuttingJobItems, orderItems, orders } from '../../db/schema';
import { eq, desc, and, isNull, inArray, sql } from 'drizzle-orm';

// Type definitions
export type CuttingJob = typeof cuttingJobs.$inferSelect;
export type CuttingJobItem = typeof cuttingJobItems.$inferSelect;

export interface OrderItemForJob {
    id: string;
    itemCode: string | null;
    itemName: string | null;
    length: number | null;
    width: number | null;
    height: number | null;
    thickness: number;
    quantity: number;
    geometryType: string;
    materialTypeId: string;
}

export type CuttingJobItemWithRelations = CuttingJobItem & {
    orderItem?: OrderItemForJob;
};

export type CuttingJobWithRelations = CuttingJob & {
    items?: CuttingJobItemWithRelations[];
    materialType?: { id: string; name: string };
    _count?: { items: number; scenarios: number };
};

export interface ICuttingJobFilter {
    status?: string;
    materialTypeId?: string;
    thickness?: number;
}

export interface ICreateCuttingJobInput {
    materialTypeId: string;
    thickness: number;
    orderItemIds?: string[];
}

export interface IUpdateCuttingJobInput {
    status?: string;
}

export interface ICreateCuttingJobItemInput {
    cuttingJobId: string;
    orderItemId: string;
    quantity: number;
}

export interface ICuttingJobRepository {
    findById(id: string): Promise<CuttingJobWithRelations | null>;
    findAll(filter?: ICuttingJobFilter): Promise<CuttingJobWithRelations[]>;
    create(data: ICreateCuttingJobInput): Promise<CuttingJob>;
    update(id: string, data: IUpdateCuttingJobInput): Promise<CuttingJob>;
    updateStatus(id: string, status: string): Promise<CuttingJob>;
    delete(id: string): Promise<void>;
    addItem(jobId: string, data: Omit<ICreateCuttingJobItemInput, 'cuttingJobId'>): Promise<CuttingJobItem>;
    removeItem(jobId: string, orderItemId: string): Promise<void>;
    getOrderItemsByIds(ids: string[]): Promise<OrderItemForJob[]>;
    findByMaterialAndThickness(materialTypeId: string, thickness: number, status?: string): Promise<CuttingJobWithRelations[]>;
    getUnassignedOrderItems(confirmedOnly: boolean): Promise<OrderItemForJob[]>;
}

export class CuttingJobRepository implements ICuttingJobRepository {
    private jobCounter = 1;

    constructor(private readonly db: Database) { }

    async findById(id: string): Promise<CuttingJobWithRelations | null> {
        const result = await this.db.query.cuttingJobs.findFirst({
            where: eq(cuttingJobs.id, id),
            with: {
                items: {
                    with: {
                        orderItem: true
                    }
                }
            }
        });

        if (!result) return null;

        // Add _count
        const itemCount = result.items?.length ?? 0;
        return {
            ...result,
            _count: { items: itemCount, scenarios: 0 }
        };
    }

    async findAll(filter?: ICuttingJobFilter): Promise<CuttingJobWithRelations[]> {
        const conditions = [];

        if (filter?.status) {
            conditions.push(eq(cuttingJobs.status, filter.status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED'));
        }
        if (filter?.materialTypeId) {
            conditions.push(eq(cuttingJobs.materialTypeId, filter.materialTypeId));
        }
        if (filter?.thickness !== undefined) {
            conditions.push(eq(cuttingJobs.thickness, filter.thickness));
        }

        const results = await this.db.query.cuttingJobs.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                items: {
                    with: {
                        orderItem: true
                    }
                }
            },
            orderBy: [desc(cuttingJobs.createdAt)]
        });

        return results.map(job => ({
            ...job,
            _count: { items: job.items?.length ?? 0, scenarios: 0 }
        }));
    }

    async create(data: ICreateCuttingJobInput): Promise<CuttingJob> {
        const jobNumber = `JOB-${Date.now()}-${this.jobCounter++}`;

        const [result] = await this.db.insert(cuttingJobs).values({
            jobNumber: jobNumber as unknown as typeof cuttingJobs.$inferInsert['jobNumber'],
            materialTypeId: data.materialTypeId,
            thickness: data.thickness
        }).returning();

        // Add items if provided
        if (data.orderItemIds && data.orderItemIds.length > 0) {
            const orderItemsData = await this.getOrderItemsByIds(data.orderItemIds);
            for (const item of orderItemsData) {
                await this.db.insert(cuttingJobItems).values({
                    cuttingJobId: result.id,
                    orderItemId: item.id,
                    quantity: item.quantity
                });
            }
        }

        return result;
    }

    async update(id: string, data: IUpdateCuttingJobInput): Promise<CuttingJob> {
        const [result] = await this.db.update(cuttingJobs)
            .set({
                status: data.status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED',
                updatedAt: new Date()
            })
            .where(eq(cuttingJobs.id, id))
            .returning();
        return result;
    }

    async updateStatus(id: string, status: string): Promise<CuttingJob> {
        const [result] = await this.db.update(cuttingJobs)
            .set({
                status: status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED',
                updatedAt: new Date()
            })
            .where(eq(cuttingJobs.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(cuttingJobs).where(eq(cuttingJobs.id, id));
    }

    async addItem(jobId: string, data: Omit<ICreateCuttingJobItemInput, 'cuttingJobId'>): Promise<CuttingJobItem> {
        const [result] = await this.db.insert(cuttingJobItems).values({
            cuttingJobId: jobId,
            orderItemId: data.orderItemId,
            quantity: data.quantity
        }).returning();
        return result;
    }

    async removeItem(jobId: string, orderItemId: string): Promise<void> {
        await this.db.delete(cuttingJobItems)
            .where(and(
                eq(cuttingJobItems.cuttingJobId, jobId),
                eq(cuttingJobItems.orderItemId, orderItemId)
            ));
    }

    async getOrderItemsByIds(ids: string[]): Promise<OrderItemForJob[]> {
        if (ids.length === 0) return [];

        const results = await this.db.select({
            id: orderItems.id,
            itemCode: orderItems.itemCode,
            itemName: orderItems.itemName,
            length: orderItems.length,
            width: orderItems.width,
            height: orderItems.height,
            thickness: orderItems.thickness,
            quantity: orderItems.quantity,
            geometryType: orderItems.geometryType,
            materialTypeId: orderItems.materialTypeId
        })
            .from(orderItems)
            .where(inArray(orderItems.id, ids));

        return results;
    }

    async findByMaterialAndThickness(
        materialTypeId: string,
        thickness: number,
        status?: string
    ): Promise<CuttingJobWithRelations[]> {
        const conditions = [
            eq(cuttingJobs.materialTypeId, materialTypeId),
            eq(cuttingJobs.thickness, thickness)
        ];

        if (status) {
            conditions.push(eq(cuttingJobs.status, status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED'));
        }

        const results = await this.db.query.cuttingJobs.findMany({
            where: and(...conditions),
            with: {
                items: {
                    with: {
                        orderItem: true
                    }
                }
            }
        });

        return results.map(job => ({
            ...job,
            _count: { items: job.items?.length ?? 0, scenarios: 0 }
        }));
    }

    async getUnassignedOrderItems(confirmedOnly: boolean): Promise<OrderItemForJob[]> {
        // Get order items that are not yet assigned to any cutting job
        const assignedItemIds = await this.db
            .select({ orderItemId: cuttingJobItems.orderItemId })
            .from(cuttingJobItems);

        const assignedIds = assignedItemIds.map(a => a.orderItemId);

        let query = this.db.select({
            id: orderItems.id,
            itemCode: orderItems.itemCode,
            itemName: orderItems.itemName,
            length: orderItems.length,
            width: orderItems.width,
            height: orderItems.height,
            thickness: orderItems.thickness,
            quantity: orderItems.quantity,
            geometryType: orderItems.geometryType,
            materialTypeId: orderItems.materialTypeId
        })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id));

        const conditions = [];

        if (confirmedOnly) {
            conditions.push(eq(orders.status, 'CONFIRMED'));
        }

        // Exclude already assigned items
        if (assignedIds.length > 0) {
            conditions.push(sql`${orderItems.id} NOT IN (${sql.join(assignedIds.map(id => sql`${id}`), sql`, `)})`);
        }

        if (conditions.length > 0) {
            return query.where(and(...conditions));
        }

        return query;
    }
}
