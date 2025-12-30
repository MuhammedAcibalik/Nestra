"use strict";
/**
 * Auth Middleware
 * Following SRP - Only handles authentication verification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = createAuthMiddleware;
exports.requireRole = requireRole;
function createAuthMiddleware(authService) {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: "Yetkilendirme token'ı bulunamadı"
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
function requireRole(...allowedRoles) {
    return (req, res, next) => {
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
//# sourceMappingURL=authMiddleware.js.map