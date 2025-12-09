/**
 * Auth Service Implementation
 * Following SOLID principles with proper typing
 */

import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

import {
    IAuthService,
    IAuthToken,
    IUserDto,
    IRegisterInput,
    ITokenPayload,
    IResult,
    success,
    failure
} from '../../core/interfaces';

import { IUserRepository, UserWithRole } from './user.repository';

export interface IAuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    saltRounds: number;
}


export class AuthService implements IAuthService {
    private static readonly EXPIRES_REGEX = /^(\d+)([smhd])$/;

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly config: IAuthConfig
    ) { }

    async login(email: string, password: string): Promise<IResult<IAuthToken>> {
        try {
            if (!email || !password) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'E-posta ve şifre zorunludur'
                });
            }

            const user = await this.userRepository.findByEmail(email);
            if (!user || !user.isActive) {
                return failure({
                    code: 'INVALID_CREDENTIALS',
                    message: 'Geçersiz e-posta veya şifre'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return failure({
                    code: 'INVALID_CREDENTIALS',
                    message: 'Geçersiz e-posta veya şifre'
                });
            }

            const tokenPayload: Omit<ITokenPayload, 'iat' | 'exp'> = {
                userId: user.id,
                email: user.email,
                roleId: user.roleId,
                roleName: user.role.name
            };

            const signOptions: SignOptions = {
                expiresIn: this.getExpiresInSeconds()
            };

            const accessToken = jwt.sign(tokenPayload, this.config.jwtSecret, signOptions);

            return success({
                accessToken,
                expiresIn: this.getExpiresInSeconds(),
                user: this.toUserDto(user)
            });
        } catch (error) {
            return failure({
                code: 'AUTH_ERROR',
                message: 'Giriş yapılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async register(data: IRegisterInput): Promise<IResult<IUserDto>> {
        try {
            if (!data.email || !data.password || !data.firstName || !data.lastName) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Tüm alanlar zorunludur'
                });
            }

            const existingUser = await this.userRepository.findByEmail(data.email);
            if (existingUser) {
                return failure({
                    code: 'USER_EXISTS',
                    message: 'Bu e-posta adresi zaten kayıtlı'
                });
            }

            const hashedPassword = await bcrypt.hash(data.password, this.config.saltRounds);

            const user = await this.userRepository.create({
                ...data,
                password: hashedPassword
            });

            return success(this.toUserDto(user));
        } catch (error) {
            return failure({
                code: 'REGISTER_ERROR',
                message: 'Kayıt yapılırken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async validateToken(token: string): Promise<IResult<ITokenPayload>> {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret) as ITokenPayload;
            return success(decoded);
        } catch {
            return failure({
                code: 'INVALID_TOKEN',
                message: 'Geçersiz veya süresi dolmuş token'
            });
        }
    }

    async logout(_token: string): Promise<IResult<void>> {
        return success(undefined);
    }

    private toUserDto(user: UserWithRole): IUserDto {
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

    private getExpiresInSeconds(): number {
        const expiresIn = this.config.jwtExpiresIn;
        const match = AuthService.EXPIRES_REGEX.exec(expiresIn);
        if (!match) return 3600;

        const value = Number.parseInt(match[1], 10);
        const unit = match[2];

        const multipliers: Record<string, number> = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400
        };

        return value * (multipliers[unit] ?? 3600);
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
