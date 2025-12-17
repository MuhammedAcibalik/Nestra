"use strict";
/**
 * Auth Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authInstaller = void 0;
const auth_1 = require("../../modules/auth");
const auth_service_handler_1 = require("../../modules/auth/auth.service-handler");
const config_1 = require("../config");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
exports.authInstaller = {
    name: 'auth',
    install(context) {
        const { db, registry } = context;
        const config = (0, config_1.getConfig)();
        const repository = new auth_1.UserRepository(db);
        // Auth config from centralized configuration
        const authConfig = {
            jwtSecret: config.jwt.secret,
            jwtExpiresIn: config.jwt.expiresIn,
            saltRounds: 10
        };
        const serviceHandler = new auth_service_handler_1.AuthServiceHandler(repository);
        registry.register('auth', serviceHandler);
        const service = new auth_1.AuthService(repository, authConfig);
        const controller = new auth_1.AuthController(service);
        return {
            router: controller.router,
            path: '/api/auth',
            middleware: [rate_limit_middleware_1.authRateLimiter], // Public but rate-limited
            service
        };
    }
};
//# sourceMappingURL=auth.installer.js.map