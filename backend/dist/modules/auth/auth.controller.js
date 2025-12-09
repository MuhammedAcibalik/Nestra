"use strict";
/**
 * Auth Controller
 * Following SRP - Only handles HTTP concerns for authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
exports.createAuthController = createAuthController;
const express_1 = require("express");
class AuthController {
    authService;
    router;
    constructor(authService) {
        this.authService = authService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post('/login', this.login.bind(this));
        this.router.post('/register', this.register.bind(this));
        this.router.post('/logout', this.logout.bind(this));
        this.router.post('/validate', this.validateToken.bind(this));
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                const status = result.error?.code === 'INVALID_CREDENTIALS' ? 401 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async register(req, res, next) {
        try {
            const result = await this.authService.register(req.body);
            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1] || '';
            const result = await this.authService.logout(token);
            if (result.success) {
                res.json({ success: true, message: 'Çıkış başarılı' });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async validateToken(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1] || req.body.token;
            if (!token) {
                res.status(400).json({
                    success: false,
                    error: { code: 'NO_TOKEN', message: 'Token gerekli' }
                });
                return;
            }
            const result = await this.authService.validateToken(token);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(401).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
function createAuthController(authService) {
    return new AuthController(authService);
}
//# sourceMappingURL=auth.controller.js.map