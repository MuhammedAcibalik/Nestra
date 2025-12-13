/**
 * Auth Service Handler
 * Exposes auth module as internal service
 * Following ISP - only exposes needed operations for cross-module access
 */

import {
    IServiceHandler,
    IServiceRequest,
    IServiceResponse
} from '../../core/services';
import { IUserRepository, UserWithRole } from './user.repository';

// ==================== INTERFACES ====================

export interface IUserSummary {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roleId: string;
    roleName: string;
    isActive: boolean;
}

// ==================== SERVICE HANDLER ====================

export class AuthServiceHandler implements IServiceHandler {
    constructor(private readonly userRepository: IUserRepository) { }

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path } = request;

        // Route: GET /users/:id
        if (method === 'GET' && /^\/users\/[\w-]+$/.exec(path)) {
            const userId = path.split('/')[2];
            return this.getUserById(userId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /users/email/:email
        if (method === 'GET' && /^\/users\/email\/.+$/.exec(path)) {
            const email = decodeURIComponent(path.split('/')[3]);
            return this.getUserByEmail(email) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getUserById(userId: string): Promise<IServiceResponse<IUserSummary>> {
        try {
            const user = await this.userRepository.findById(userId);

            if (!user) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'User not found' }
                };
            }

            // findById doesn't include role, so we fetch by email for full data
            // This is a limitation of the current repository interface
            return {
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roleId: user.roleId,
                    roleName: '', // Limited by repository interface
                    isActive: user.isActive
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getUserByEmail(email: string): Promise<IServiceResponse<IUserSummary>> {
        try {
            const user = await this.userRepository.findByEmail(email);

            if (!user) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'User not found' }
                };
            }

            return {
                success: true,
                data: this.toSummary(user)
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private toSummary(user: UserWithRole): IUserSummary {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: user.roleId,
            roleName: user.role.name,
            isActive: user.isActive
        };
    }
}
