import { UserRepository } from '../user.repository';
import { createMockDatabase, MockProxy } from '../../../core/test/db-mock';
import { Database } from '../../../db';

describe('UserRepository', () => {
    let repository: UserRepository;
    let db: MockProxy<Database>;

    beforeEach(() => {
        db = createMockDatabase();
        repository = new UserRepository(db);
    });

    describe('findById', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com' };
            (db.query as any).users.findFirst.mockResolvedValue(mockUser);

            const result = await repository.findById('user-1');

            expect(result).toEqual(mockUser);
        });

        it('should return null when not found', async () => {
            (db.query as any).users.findFirst.mockResolvedValue(null);

            const result = await repository.findById('user-1');

            expect(result).toBeNull();
        });
    });

    describe('findByEmail', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com', role: { id: 'role-1', name: 'OPERATOR' } };
            (db.query as any).users.findFirst.mockResolvedValue(mockUser);

            const result = await repository.findByEmail('test@example.com');

            expect(result).toEqual(mockUser);
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
                roleId: 'role-1'
            };

            const mockRole = { id: 'role-1', name: 'OPERATOR' };
            (db.query as any).roles.findFirst.mockResolvedValue(mockRole);
            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockUser])
                })
            });

            const result = await repository.create(input);

            expect(result.id).toBe('user-1');
            expect(result.email).toBe('test@example.com');
        });
    });

    describe('update', () => {
        it('should update user successfully', async () => {
            const updateData = { firstName: 'Updated' };
            const mockUser = { id: 'user-1', firstName: 'Updated' };

            (db.update as jest.Mock).mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([mockUser])
                    })
                })
            });

            const result = await repository.update('user-1', updateData);

            expect(result).toEqual(mockUser);
        });
    });
});
