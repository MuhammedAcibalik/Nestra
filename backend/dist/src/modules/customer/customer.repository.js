"use strict";
/**
 * Customer Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class CustomerRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query.customers.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.customers.id, id)
        });
        return result ?? null;
    }
    async findByCode(code) {
        const result = await this.db.query.customers.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.customers.code, code)
        });
        return result ?? null;
    }
    async findAll(filter) {
        if (filter?.search) {
            return this.db
                .select()
                .from(schema_1.customers)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.customers.name, `%${filter.search}%`), (0, drizzle_orm_1.ilike)(schema_1.customers.code, `%${filter.search}%`), (0, drizzle_orm_1.ilike)(schema_1.customers.email, `%${filter.search}%`)))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.customers.name));
        }
        return this.db.query.customers.findMany({
            orderBy: [(0, drizzle_orm_1.asc)(schema_1.customers.name)]
        });
    }
    async create(data) {
        const [result] = await this.db
            .insert(schema_1.customers)
            .values({
            code: data.code,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            taxId: data.taxId
        })
            .returning();
        return result;
    }
    async update(id, data) {
        const [result] = await this.db
            .update(schema_1.customers)
            .set({
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            taxId: data.taxId,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.customers.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        await this.db.delete(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.id, id));
    }
}
exports.CustomerRepository = CustomerRepository;
//# sourceMappingURL=customer.repository.js.map