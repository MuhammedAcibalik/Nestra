import { PrismaClient, User, Role } from '@prisma/client';
import { IRegisterInput } from '../../core/interfaces';

export type UserWithRole = User & { role: Role };

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<UserWithRole | null>;
    create(data: IRegisterInput & { password: string }): Promise<UserWithRole>;
    update(id: string, data: Partial<User>): Promise<User>;
}

export class UserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findByEmail(email: string): Promise<UserWithRole | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { role: true }
        });
    }

    async create(data: IRegisterInput & { password: string }): Promise<UserWithRole> {
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: {
                    connect: { name: 'OPERATOR' }
                }
            },
            include: { role: true }
        });
    }

    async update(id: string, data: Partial<User>): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data
        });
    }
}
