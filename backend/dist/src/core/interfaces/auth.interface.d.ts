/**
 * Auth Module Interfaces
 */
import { IResult } from './result.interface';
export interface IAuthService {
    login(email: string, password: string): Promise<IResult<IAuthToken>>;
    register(data: IRegisterInput): Promise<IResult<IUserDto>>;
    validateToken(token: string): Promise<IResult<ITokenPayload>>;
    logout(token: string): Promise<IResult<void>>;
}
export interface IAuthToken {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    user: IUserDto;
}
export interface IRegisterInput {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId?: string;
}
export interface IUserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleDisplayName: string;
    isActive: boolean;
}
export interface ITokenPayload {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    tenantId?: string;
    tenantSlug?: string;
    iat: number;
    exp: number;
}
//# sourceMappingURL=auth.interface.d.ts.map