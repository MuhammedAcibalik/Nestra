/**
 * User Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { users, roles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { IRegisterInput } from '../../core/interfaces';

// Type definitions
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type UserWithRole = User & { role: Role };

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<UserWithRole | null>;
    create(data: IRegisterInput & { password: string }): Promise<UserWithRole>;
    update(id: string, data: Partial<User>): Promise<User>;
}

export class UserRepository implements IUserRepository {
    constructor(private readonly db: Database) {}

    async findById(id: string): Promise<User | null> {
        const result = await this.db.query.users.findFirst({
            where: eq(users.id, id)
        });
        return result ?? null;
    }

    async findByEmail(email: string): Promise<UserWithRole | null> {
        const result = await this.db.query.users.findFirst({
            where: eq(users.email, email),
            with: { role: true }
        });
        return result ?? null;
    }

    async create(data: IRegisterInput & { password: string }): Promise<UserWithRole> {
        // Find default role, create if not exists
        let defaultRole = await this.db.query.roles.findFirst({
            where: eq(roles.name, 'OPERATOR')
        });

        // Auto-create OPERATOR role if missing (prevents crash on fresh installation)
        if (!defaultRole) {
            const [newRole] = await this.db
                .insert(roles)
                .values({
                    name: 'OPERATOR',
                    displayName: 'Operator',
                    permissions: ['read', 'production.operate']
                })
                .returning();
            defaultRole = newRole;
            console.log('✅ Created default OPERATOR role');
        }

        const [user] = await this.db
            .insert(users)
            .values({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                roleId: defaultRole.id
            })
            .returning();

        return { ...user, role: defaultRole };
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        const [result] = await this.db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return result;
    }
}
