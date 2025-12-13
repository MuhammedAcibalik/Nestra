/**
 * Auth Service Handler
 * Exposes auth module as internal service
 * Following ISP - only exposes needed operations for cross-module access
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { IUserRepository } from './user.repository';
export interface IUserSummary {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    roleName: string;
    isActive: boolean;
}
export declare class AuthServiceHandler implements IServiceHandler {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getUserById;
    private getUserByEmail;
    private toSummary;
}
//# sourceMappingURL=auth.service-handler.d.ts.map