"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_repository_1 = require("../user.repository");
const db_mock_1 = require("../../../core/test/db-mock");
describe('UserRepository', () => {
    let repository;
    let db;
    beforeEach(() => {
        db = (0, db_mock_1.createMockDatabase)();
        repository = new user_repository_1.UserRepository(db);
    });
    describe('findById', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com' };
            db.query.users.findFirst.mockResolvedValue(mockUser);
            const result = await repository.findById('user-1');
            expect(result).toEqual(mockUser);
        });
        it('should return null when not found', async () => {
            db.query.users.findFirst.mockResolvedValue(null);
            const result = await repository.findById('user-1');
            expect(result).toBeNull();
        });
    });
    describe('findByEmail', () => {
        it('should return user when found', async () => {
            const mockUser = { id: 'user-1', email: 'test@example.com', role: { id: 'role-1', name: 'OPERATOR' } };
            db.query.users.findFirst.mockResolvedValue(mockUser);
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
            db.query.roles.findFirst.mockResolvedValue(mockRole);
            db.insert.mockReturnValue({
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
            db.update.mockReturnValue({
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
//# sourceMappingURL=user.repository.spec.js.map