/**
 * User Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { users, roles } from '../../db/schema';
import { IRegisterInput } from '../../core/interfaces';
export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type UserWithRole = User & {
    role: Role;
};
export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<UserWithRole | null>;
    create(data: IRegisterInput & {
        password: string;
    }): Promise<UserWithRole>;
    update(id: string, data: Partial<User>): Promise<User>;
}
export declare class UserRepository implements IUserRepository {
    private readonly db;
    constructor(db: Database);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<UserWithRole | null>;
    create(data: IRegisterInput & {
        password: string;
    }): Promise<UserWithRole>;
    update(id: string, data: Partial<User>): Promise<User>;
}
//# sourceMappingURL=user.repository.d.ts.map