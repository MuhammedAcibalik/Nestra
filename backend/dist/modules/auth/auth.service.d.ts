/**
 * Auth Service Implementation
 * Following SOLID principles with proper typing
 */
import { IAuthService, IAuthToken, IUserDto, IRegisterInput, ITokenPayload, IResult } from '../../core/interfaces';
import { IUserRepository } from './user.repository';
export interface IAuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    saltRounds: number;
}
export declare class AuthService implements IAuthService {
    private readonly userRepository;
    private readonly config;
    constructor(userRepository: IUserRepository, config: IAuthConfig);
    login(email: string, password: string): Promise<IResult<IAuthToken>>;
    register(data: IRegisterInput): Promise<IResult<IUserDto>>;
    validateToken(token: string): Promise<IResult<ITokenPayload>>;
    logout(_token: string): Promise<IResult<void>>;
    private toUserDto;
    private getExpiresInSeconds;
    private getErrorMessage;
}
//# sourceMappingURL=auth.service.d.ts.map