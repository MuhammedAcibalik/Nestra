"use strict";
/**
 * Auth Service Handler
 * Exposes auth module as internal service
 * Following ISP - only exposes needed operations for cross-module access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServiceHandler = void 0;
// ==================== SERVICE HANDLER ====================
class AuthServiceHandler {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async handle(request) {
        const { method, path } = request;
        // Route: GET /users/:id
        if (method === 'GET' && /^\/users\/[\w-]+$/.exec(path)) {
            const userId = path.split('/')[2];
            return this.getUserById(userId);
        }
        // Route: GET /users/email/:email
        if (method === 'GET' && /^\/users\/email\/.+$/.exec(path)) {
            const email = decodeURIComponent(path.split('/')[3]);
            return this.getUserByEmail(email);
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getUserById(userId) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getUserByEmail(email) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    toSummary(user) {
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
exports.AuthServiceHandler = AuthServiceHandler;
//# sourceMappingURL=auth.service-handler.js.map