/**
 * Auth Middleware
 * Following SRP - Only handles authentication verification
 */

import { Request, Response, NextFunction } from 'express';
import { IAuthService, ITokenPayload } from '../core/interfaces';

export interface AuthenticatedRequest extends Request {
    user?: ITokenPayload;
}

export function createAuthMiddleware(authService: IAuthService) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Yetkilendirme token\'ı bulunamadı'
                }
            });
            return;
        }

        const token = authHeader.split(' ')[1];
        const result = await authService.validateToken(token);

        if (!result.success) {
            res.status(401).json({
                success: false,
                error: result.error
            });
            return;
        }

        req.user = result.data;
        next();
    };
}

/**
 * Role-based authorization middleware
 * Following OCP - Can add new roles without modifying existing code
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NOT_AUTHENTICATED',
                    message: 'Kimlik doğrulama gerekli'
                }
            });
            return;
        }

        if (!allowedRoles.includes(req.user.roleName)) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Bu işlem için yetkiniz yok'
                }
            });
            return;
        }

        next();
    };
}
