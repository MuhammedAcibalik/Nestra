"use strict";
/**
 * Auth Service Implementation
 * Following SOLID principles with proper typing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const interfaces_1 = require("../../core/interfaces");
class AuthService {
    userRepository;
    config;
    constructor(userRepository, config) {
        this.userRepository = userRepository;
        this.config = config;
    }
    async login(email, password) {
        try {
            if (!email || !password) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'E-posta ve şifre zorunludur'
                });
            }
            const user = await this.userRepository.findByEmail(email);
            if (!user || !user.isActive) {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_CREDENTIALS',
                    message: 'Geçersiz e-posta veya şifre'
                });
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                return (0, interfaces_1.failure)({
                    code: 'INVALID_CREDENTIALS',
                    message: 'Geçersiz e-posta veya şifre'
                });
            }
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                roleId: user.roleId,
                roleName: user.role.name
            };
            const signOptions = {
                expiresIn: this.getExpiresInSeconds()
            };
            const accessToken = jsonwebtoken_1.default.sign(tokenPayload, this.config.jwtSecret, signOptions);
            return (0, interfaces_1.success)({
                accessToken,
                expiresIn: this.getExpiresInSeconds(),
                user: this.toUserDto(user)
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'AUTH_ERROR',
                message: 'Giriş yapılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async register(data) {
        try {
            if (!data.email || !data.password || !data.firstName || !data.lastName) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Tüm alanlar zorunludur'
                });
            }
            const existingUser = await this.userRepository.findByEmail(data.email);
            if (existingUser) {
                return (0, interfaces_1.failure)({
                    code: 'USER_EXISTS',
                    message: 'Bu e-posta adresi zaten kayıtlı'
                });
            }
            const hashedPassword = await bcryptjs_1.default.hash(data.password, this.config.saltRounds);
            const user = await this.userRepository.create({
                ...data,
                password: hashedPassword
            });
            return (0, interfaces_1.success)(this.toUserDto(user));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'REGISTER_ERROR',
                message: 'Kayıt yapılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async validateToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.jwtSecret);
            return (0, interfaces_1.success)(decoded);
        }
        catch {
            return (0, interfaces_1.failure)({
                code: 'INVALID_TOKEN',
                message: 'Geçersiz veya süresi dolmuş token'
            });
        }
    }
    async logout(_token) {
        return (0, interfaces_1.success)(undefined);
    }
    toUserDto(user) {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.name,
            roleDisplayName: user.role.displayName,
            isActive: user.isActive
        };
    }
    getExpiresInSeconds() {
        const expiresIn = this.config.jwtExpiresIn;
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return 3600;
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400
        };
        return value * (multipliers[unit] ?? 3600);
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map