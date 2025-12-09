"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../auth.service");
const jest_mock_extended_1 = require("jest-mock-extended");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock bcrypt and jwt
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
describe('AuthService', () => {
    let service;
    let userRepository;
    let config;
    beforeEach(() => {
        userRepository = (0, jest_mock_extended_1.mock)();
        config = {
            jwtSecret: 'secret',
            jwtExpiresIn: '1h',
            saltRounds: 10
        };
        service = new auth_service_1.AuthService(userRepository, config);
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
            userRepository.findByEmail.mockResolvedValue(user);
            bcryptjs_1.default.compare.mockResolvedValue(true);
            jsonwebtoken_1.default.sign.mockReturnValue('token');
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
            userRepository.findByEmail.mockResolvedValue(user);
            bcryptjs_1.default.compare.mockResolvedValue(false);
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
            bcryptjs_1.default.hash.mockResolvedValue('hashedPassword');
            userRepository.create.mockResolvedValue(savedUser);
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
            userRepository.findByEmail.mockResolvedValue({ id: '1' });
            const result = await service.register(input);
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('USER_EXISTS');
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map