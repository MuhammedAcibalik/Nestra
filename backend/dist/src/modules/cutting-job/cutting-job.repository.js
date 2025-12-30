"use strict";
/**
 * Cutting Job Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../../core/database");
const tenant_1 = require("../../core/tenant");
class CuttingJobRepository {
    db;
    jobCounter = 1;
    constructor(db) {
        this.db = db;
    }
    // ==================== TENANT FILTERING ====================
    getTenantFilter() {
        const tenantId = (0, tenant_1.getCurrentTenantIdOptional)();
        if (!tenantId)
            return undefined;
        return (0, drizzle_orm_1.eq)(schema_1.cuttingJobs.tenantId, tenantId);
    }
    withTenantFilter(conditions) {
        const tenantFilter = this.getTenantFilter();
        if (tenantFilter)
            conditions.push(tenantFilter);
        return conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    }
    getCurrentTenantId() {
        return (0, tenant_1.getCurrentTenantIdOptional)();
    }
    // ==================== READ OPERATIONS ====================
    async findById(id) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.cuttingJobs.id, id)];
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
        if (!result)
            return null;
        const itemCount = result.items?.length ?? 0;
        return {
            ...result,
            _count: { items: itemCount, scenarios: 0 }
        };
    }
    async findAll(filter) {
        const where = (0, database_1.createFilter)()
            .eq(schema_1.cuttingJobs.status, filter?.status)
            .eq(schema_1.cuttingJobs.materialTypeId, filter?.materialTypeId)
            .eq(schema_1.cuttingJobs.thickness, filter?.thickness)
            .eq(schema_1.cuttingJobs.tenantId, this.getCurrentTenantId())
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
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.cuttingJobs.createdAt)]
        });
        return results.map((job) => ({
            ...job,
            _count: { items: job.items?.length ?? 0, scenarios: 0 }
        }));
    }
    async findByMaterialAndThickness(materialTypeId, thickness, status) {
        const where = (0, database_1.createFilter)()
            .eq(schema_1.cuttingJobs.materialTypeId, materialTypeId)
            .eq(schema_1.cuttingJobs.thickness, thickness)
            .eq(schema_1.cuttingJobs.status, status)
            .eq(schema_1.cuttingJobs.tenantId, this.getCurrentTenantId())
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
    async create(data) {
        const jobNumber = `JOB-${Date.now()}-${this.jobCounter++}`;
        const [result] = await this.db
            .insert(schema_1.cuttingJobs)
            .values({
            tenantId: this.getCurrentTenantId(),
            jobNumber: jobNumber,
            materialTypeId: data.materialTypeId,
            thickness: data.thickness
        })
            .returning();
        if (data.orderItemIds && data.orderItemIds.length > 0) {
            const orderItemsData = await this.getOrderItemsByIds(data.orderItemIds);
            for (const item of orderItemsData) {
                await this.db.insert(schema_1.cuttingJobItems).values({
                    cuttingJobId: result.id,
                    orderItemId: item.id,
                    quantity: item.quantity
                });
            }
        }
        return result;
    }
    async update(id, data) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.cuttingJobs.id, id)];
        const where = this.withTenantFilter(conditions);
        const [result] = await this.db
            .update(schema_1.cuttingJobs)
            .set({
            status: data.status,
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.cuttingJobs.id, id))
            .returning();
        return result;
    }
    async updateStatus(id, status) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.cuttingJobs.id, id)];
        const where = this.withTenantFilter(conditions);
        const [result] = await this.db
            .update(schema_1.cuttingJobs)
            .set({
            status: status,
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.cuttingJobs.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.cuttingJobs.id, id)];
        const where = this.withTenantFilter(conditions);
        await this.db.delete(schema_1.cuttingJobs).where(where ?? (0, drizzle_orm_1.eq)(schema_1.cuttingJobs.id, id));
    }
    // ==================== JOB ITEMS ====================
    async addItem(jobId, data) {
        const [result] = await this.db
            .insert(schema_1.cuttingJobItems)
            .values({
            cuttingJobId: jobId,
            orderItemId: data.orderItemId,
            quantity: data.quantity
        })
            .returning();
        return result;
    }
    async removeItem(jobId, orderItemId) {
        await this.db
            .delete(schema_1.cuttingJobItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cuttingJobItems.cuttingJobId, jobId), (0, drizzle_orm_1.eq)(schema_1.cuttingJobItems.orderItemId, orderItemId)));
    }
    // ==================== ORDER ITEMS ====================
    async getOrderItemsByIds(ids) {
        if (ids.length === 0)
            return [];
        const results = await this.db
            .select({
            id: schema_1.orderItems.id,
            itemCode: schema_1.orderItems.itemCode,
            itemName: schema_1.orderItems.itemName,
            length: schema_1.orderItems.length,
            width: schema_1.orderItems.width,
            height: schema_1.orderItems.height,
            thickness: schema_1.orderItems.thickness,
            quantity: schema_1.orderItems.quantity,
            geometryType: schema_1.orderItems.geometryType,
            materialTypeId: schema_1.orderItems.materialTypeId
        })
            .from(schema_1.orderItems)
            .where((0, drizzle_orm_1.inArray)(schema_1.orderItems.id, ids));
        return results;
    }
    async getUnassignedOrderItems(confirmedOnly) {
        const assignedItemIds = await this.db
            .select({ orderItemId: schema_1.cuttingJobItems.orderItemId })
            .from(schema_1.cuttingJobItems);
        const assignedIds = assignedItemIds.map((a) => a.orderItemId);
        const query = this.db
            .select({
            id: schema_1.orderItems.id,
            itemCode: schema_1.orderItems.itemCode,
            itemName: schema_1.orderItems.itemName,
            length: schema_1.orderItems.length,
            width: schema_1.orderItems.width,
            height: schema_1.orderItems.height,
            thickness: schema_1.orderItems.thickness,
            quantity: schema_1.orderItems.quantity,
            geometryType: schema_1.orderItems.geometryType,
            materialTypeId: schema_1.orderItems.materialTypeId
        })
            .from(schema_1.orderItems)
            .innerJoin(schema_1.orders, (0, drizzle_orm_1.eq)(schema_1.orderItems.orderId, schema_1.orders.id));
        const conditions = [];
        // Filter by tenant
        const tenantId = this.getCurrentTenantId();
        if (tenantId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId));
        }
        if (confirmedOnly) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.status, 'CONFIRMED'));
        }
        if (assignedIds.length > 0) {
            conditions.push((0, drizzle_orm_1.sql) `${schema_1.orderItems.id} NOT IN (${drizzle_orm_1.sql.join(assignedIds.map((id) => (0, drizzle_orm_1.sql) `${id}`), (0, drizzle_orm_1.sql) `, `)})`);
        }
        if (conditions.length > 0) {
            return query.where((0, drizzle_orm_1.and)(...conditions));
        }
        return query;
    }
}
exports.CuttingJobRepository = CuttingJobRepository;
//# sourceMappingURL=cutting-job.repository.js.map