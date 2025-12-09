import { PrismaClient, User, Role } from '@prisma/client';
import { IRegisterInput } from '../../core/interfaces';
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
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<UserWithRole | null>;
    create(data: IRegisterInput & {
        password: string;
    }): Promise<UserWithRole>;
    update(id: string, data: Partial<User>): Promise<User>;
}
//# sourceMappingURL=user.repository.d.ts.map