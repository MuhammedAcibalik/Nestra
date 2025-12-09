import { UserRepository } from '../user.repository';
import { PrismaClient } from '@prisma/client';
import { mock, MockProxy } from 'jest-mock-extended';

describe('UserRepository', () => {
    let repository: UserRepository;
    let prisma: MockProxy<PrismaClient>;
    let prismaUser: any; // Mock for prisma.user delegate

    beforeEach(() => {
        prisma = mock<PrismaClient>();
        prismaUser = mock<any>();
        (prisma as any).user = prismaUser;
        repository = new UserRepository(prisma);
    });

    describe('findById', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com' };
            prismaUser.findUnique.mockResolvedValue(mockUser);

            const result = await repository.findById('user-1');

            expect(result).toEqual(mockUser);
            expect(prismaUser.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
        });

        it('should return null when not found', async () => {
            prismaUser.findUnique.mockResolvedValue(null);

            const result = await repository.findById('user-1');

            expect(result).toBeNull();
        });
    });

    describe('findByEmail', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com' };
            prismaUser.findUnique.mockResolvedValue(mockUser);

            const result = await repository.findByEmail('test@example.com');

            expect(result).toEqual(mockUser);
            expect(prismaUser.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                include: { role: true }
            });
        });
    });

    describe('create', () => {
        it('should create user successfully', async () => {
            const input = {
                email: 'test@example.com',
                password: 'hashed-password',
                firstName: 'Test',
                lastName: 'User'
            };
            const mockUser = {
                id: 'user-1',
                ...input,
                role: { id: 'role-1', name: 'OPERATOR' }
            };

            prismaUser.create.mockResolvedValue(mockUser);

            const result = await repository.create(input);

            expect(result).toEqual(mockUser);
            expect(prismaUser.create).toHaveBeenCalledWith({
                data: {
                    ...input,
                    role: { connect: { name: 'OPERATOR' } }
                },
                include: { role: true }
            });
        });
    });

    describe('update', () => {
        it('should update user successfully', async () => {
            const updateData = { firstName: 'Updated' };
            const mockUser = { id: 'user-1', firstName: 'Updated' };

            prismaUser.update.mockResolvedValue(mockUser);

            const result = await repository.update('user-1', updateData);

            expect(result).toEqual(mockUser);
            expect(prismaUser.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: updateData
            });
        });
    });
});
