/**
 * Cutting Job Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */

import { Database } from '../../db';
import { cuttingJobs, cuttingJobItems, orderItems, orders } from '../../db/schema';
import { eq, desc, and, inArray, sql, SQL } from 'drizzle-orm';
import { createFilter } from '../../core/database';
import { getCurrentTenantIdOptional } from '../../core/tenant';

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
    findByMaterialAndThickness(
        materialTypeId: string,
        thickness: number,
        status?: string
    ): Promise<CuttingJobWithRelations[]>;
    getUnassignedOrderItems(confirmedOnly: boolean): Promise<OrderItemForJob[]>;
}

export class CuttingJobRepository implements ICuttingJobRepository {
    private jobCounter = 1;

    constructor(private readonly db: Database) {}

    // ==================== TENANT FILTERING ====================

    private getTenantFilter(): SQL | undefined {
        const tenantId = getCurrentTenantIdOptional();
        if (!tenantId) return undefined;
        return eq(cuttingJobs.tenantId, tenantId);
    }

    private withTenantFilter(conditions: SQL[]): SQL | undefined {
        const tenantFilter = this.getTenantFilter();
        if (tenantFilter) conditions.push(tenantFilter);
        return conditions.length > 0 ? and(...conditions) : undefined;
    }

    private getCurrentTenantId(): string | undefined {
        return getCurrentTenantIdOptional();
    }

    // ==================== READ OPERATIONS ====================

    async findById(id: string): Promise<CuttingJobWithRelations | null> {
        const conditions = [eq(cuttingJobs.id, id)];
        const where = this.withTenantFilter(conditions);

        const result = await this.db.query.cuttingJobs.findFirst({
            where,
            with: {
                items: {
                    with: {
                        orderItem: true
                    }
                }
            }
        });

        if (!result) return null;

        const itemCount = result.items?.length ?? 0;
        return {
            ...result,
            _count: { items: itemCount, scenarios: 0 }
        };
    }

    async findAll(filter?: ICuttingJobFilter): Promise<CuttingJobWithRelations[]> {
        const where = createFilter()
            .eq(
                cuttingJobs.status,
                filter?.status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED' | undefined
            )
            .eq(cuttingJobs.materialTypeId, filter?.materialTypeId)
            .eq(cuttingJobs.thickness, filter?.thickness)
            .eq(cuttingJobs.tenantId, this.getCurrentTenantId())
            .build();

        const results = await this.db.query.cuttingJobs.findMany({
            where,
            with: {
                items: {
                    with: {
                        orderItem: true
                    }
                }
            },
            orderBy: [desc(cuttingJobs.createdAt)]
        });

        return results.map((job) => ({
            ...job,
            _count: { items: job.items?.length ?? 0, scenarios: 0 }
        }));
    }

    async findByMaterialAndThickness(
        materialTypeId: string,
        thickness: number,
        status?: string
    ): Promise<CuttingJobWithRelations[]> {
        const where = createFilter()
            .eq(cuttingJobs.materialTypeId, materialTypeId)
            .eq(cuttingJobs.thickness, thickness)
            .eq(
                cuttingJobs.status,
                status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED' | undefined
            )
            .eq(cuttingJobs.tenantId, this.getCurrentTenantId())
            .build();

        const results = await this.db.query.cuttingJobs.findMany({
            where,
            with: {
                items: {
                    with: {
                        orderItem: true
                    }
                }
            }
        });

        return results.map((job) => ({
            ...job,
            _count: { items: job.items?.length ?? 0, scenarios: 0 }
        }));
    }

    // ==================== WRITE OPERATIONS ====================

    async create(data: ICreateCuttingJobInput): Promise<CuttingJob> {
        const jobNumber = `JOB-${Date.now()}-${this.jobCounter++}`;

        const [result] = await this.db
            .insert(cuttingJobs)
            .values({
                tenantId: this.getCurrentTenantId(),
                jobNumber: jobNumber as unknown as (typeof cuttingJobs.$inferInsert)['jobNumber'],
                materialTypeId: data.materialTypeId,
                thickness: data.thickness
            })
            .returning();

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
        const conditions = [eq(cuttingJobs.id, id)];
        const where = this.withTenantFilter(conditions);

        const [result] = await this.db
            .update(cuttingJobs)
            .set({
                status: data.status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED',
                updatedAt: new Date()
            })
            .where(where ?? eq(cuttingJobs.id, id))
            .returning();
        return result;
    }

    async updateStatus(id: string, status: string): Promise<CuttingJob> {
        const conditions = [eq(cuttingJobs.id, id)];
        const where = this.withTenantFilter(conditions);

        const [result] = await this.db
            .update(cuttingJobs)
            .set({
                status: status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED',
                updatedAt: new Date()
            })
            .where(where ?? eq(cuttingJobs.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        const conditions = [eq(cuttingJobs.id, id)];
        const where = this.withTenantFilter(conditions);

        await this.db.delete(cuttingJobs).where(where ?? eq(cuttingJobs.id, id));
    }

    // ==================== JOB ITEMS ====================

    async addItem(jobId: string, data: Omit<ICreateCuttingJobItemInput, 'cuttingJobId'>): Promise<CuttingJobItem> {
        const [result] = await this.db
            .insert(cuttingJobItems)
            .values({
                cuttingJobId: jobId,
                orderItemId: data.orderItemId,
                quantity: data.quantity
            })
            .returning();
        return result;
    }

    async removeItem(jobId: string, orderItemId: string): Promise<void> {
        await this.db
            .delete(cuttingJobItems)
            .where(and(eq(cuttingJobItems.cuttingJobId, jobId), eq(cuttingJobItems.orderItemId, orderItemId)));
    }

    // ==================== ORDER ITEMS ====================

    async getOrderItemsByIds(ids: string[]): Promise<OrderItemForJob[]> {
        if (ids.length === 0) return [];

        const results = await this.db
            .select({
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

    async getUnassignedOrderItems(confirmedOnly: boolean): Promise<OrderItemForJob[]> {
        const assignedItemIds = await this.db
            .select({ orderItemId: cuttingJobItems.orderItemId })
            .from(cuttingJobItems);

        const assignedIds = assignedItemIds.map((a) => a.orderItemId);

        const query = this.db
            .select({
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

        // Filter by tenant
        const tenantId = this.getCurrentTenantId();
        if (tenantId) {
            conditions.push(eq(orders.tenantId, tenantId));
        }

        if (confirmedOnly) {
            conditions.push(eq(orders.status, 'CONFIRMED'));
        }

        if (assignedIds.length > 0) {
            conditions.push(
                sql`${orderItems.id} NOT IN (${sql.join(
                    assignedIds.map((id) => sql`${id}`),
                    sql`, `
                )})`
            );
        }

        if (conditions.length > 0) {
            return query.where(and(...conditions));
        }

        return query;
    }
}
