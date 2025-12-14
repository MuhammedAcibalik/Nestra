/**
 * Auth Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { UserRepository, AuthService, AuthController, IAuthConfig } from '../../modules/auth';
import { AuthServiceHandler } from '../../modules/auth/auth.service-handler';
import { getConfig } from '../config';
import { authRateLimiter } from '../../middleware/rate-limit.middleware';

export const authInstaller: IModuleInstaller = {
    name: 'auth',

    install(context: IInstallContext): IModuleResult {
        const { prisma, registry } = context;
        const config = getConfig();

        const repository = new UserRepository(prisma);

        // Auth config from centralized configuration
        const authConfig: IAuthConfig = {
            jwtSecret: config.jwt.secret,
            jwtExpiresIn: config.jwt.expiresIn,
            saltRounds: 10
        };

        const serviceHandler = new AuthServiceHandler(repository);
        registry.register('auth', serviceHandler);

        const service = new AuthService(repository, authConfig);
        const controller = new AuthController(service);

        return {
            router: controller.router,
            path: '/api/auth',
            middleware: [authRateLimiter], // Public but rate-limited
            service
        };
    }
};
