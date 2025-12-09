/**
 * Auth Middleware
 * Following SRP - Only handles authentication verification
 */
import { Request, Response, NextFunction } from 'express';
import { IAuthService, ITokenPayload } from '../core/interfaces';
export interface AuthenticatedRequest extends Request {
    user?: ITokenPayload;
}
export declare function createAuthMiddleware(authService: IAuthService): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Role-based authorization middleware
 * Following OCP - Can add new roles without modifying existing code
 */
export declare function requireRole(...allowedRoles: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map