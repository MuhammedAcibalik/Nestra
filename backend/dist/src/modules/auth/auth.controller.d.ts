/**
 * Auth Controller
 * Following SRP - Only handles HTTP concerns for authentication
 */
import { Router } from 'express';
import { IAuthService } from '../../core/interfaces';
export declare class AuthController {
    private readonly authService;
    router: Router;
    constructor(authService: IAuthService);
    private initializeRoutes;
    private login;
    private register;
    private logout;
    private validateToken;
}
export declare function createAuthController(authService: IAuthService): AuthController;
//# sourceMappingURL=auth.controller.d.ts.map