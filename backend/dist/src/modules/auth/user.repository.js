"use strict";
/**
 * User Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class UserRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.id, id)
        });
        return result ?? null;
    }
    async findByEmail(email) {
        const result = await this.db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.email, email),
            with: { role: true }
        });
        return result ?? null;
    }
    async create(data) {
        // Find default role, create if not exists
        let defaultRole = await this.db.query.roles.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.roles.name, 'OPERATOR')
        });
        // Auto-create OPERATOR role if missing (prevents crash on fresh installation)
        if (!defaultRole) {
            const [newRole] = await this.db.insert(schema_1.roles).values({
                name: 'OPERATOR',
                displayName: 'Operator',
                permissions: ['read', 'production.operate']
            }).returning();
            defaultRole = newRole;
            console.log('✅ Created default OPERATOR role');
        }
        const [user] = await this.db.insert(schema_1.users).values({
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            roleId: defaultRole.id
        }).returning();
        return { ...user, role: defaultRole };
    }
    async update(id, data) {
        const [result] = await this.db.update(schema_1.users)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return result;
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=user.repository.js.map