import { AuthService, IAuthConfig } from '../auth.service';
import { IUserRepository, UserWithRole } from '../user.repository';
import { mock, MockProxy } from 'jest-mock-extended';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock bcrypt and jwt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
    let service: AuthService;
    let userRepository: MockProxy<IUserRepository>;
    let config: IAuthConfig;

    beforeEach(() => {
        userRepository = mock<IUserRepository>();
        config = {
            jwtSecret: 'secret',
            jwtExpiresIn: '1h',
            saltRounds: 10
        };
        service = new AuthService(userRepository, config);
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            const email = 'test@example.com';
            const password = 'password123';
            const hashedPassword = 'hashedPassword';
            const user = {
                id: '1',
                email,
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                roleId: 'role-1',
                isActive: true,
                role: { name: 'admin', displayName: 'Admin' }
            };

            userRepository.findByEmail.mockResolvedValue(user as unknown as UserWithRole);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('token');

            const result = await service.login(email, password);

            expect(result.success).toBe(true);
            expect(result.data?.accessToken).toBe('token');
            expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
        });

        it('should fail with invalid credentials', async () => {
            const email = 'test@example.com';
            const password = 'wrongpassword';
            const user = {
                id: '1',
                email,
                password: 'hashedPassword',
                isActive: true
            };

            userRepository.findByEmail.mockResolvedValue(user as unknown as UserWithRole);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const result = await service.login(email, password);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_CREDENTIALS');
        });

        it('should fail if user not found', async () => {
            userRepository.findByEmail.mockResolvedValue(null);

            const result = await service.login('test@example.com', 'password');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_CREDENTIALS');
        });
    });

    describe('register', () => {
        it('should register new user successfully', async () => {
            const input = {
                email: 'new@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
                roleId: 'role-1'
            };

            const savedUser = {
                ...input,
                id: '1',
                isActive: true,
                role: { name: 'user', displayName: 'User' }
            };

            userRepository.findByEmail.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            userRepository.create.mockResolvedValue(savedUser as unknown as UserWithRole);

            const result = await service.register(input);

            expect(result.success).toBe(true);
            expect(result.data?.email).toBe(input.email);
            expect(userRepository.create).toHaveBeenCalled();
        });

        it('should fail if email already exists', async () => {
            const input = {
                email: 'existing@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            };

            userRepository.findByEmail.mockResolvedValue({ id: '1' } as unknown as UserWithRole);

            const result = await service.register(input);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('USER_EXISTS');
        });
    });
});
