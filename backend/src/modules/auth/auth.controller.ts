/**
 * Auth Controller
 * Following SRP - Only handles HTTP concerns for authentication
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../core/interfaces';

export class AuthController {
    public router: Router;

    constructor(private readonly authService: IAuthService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post('/login', this.login.bind(this));
        this.router.post('/register', this.register.bind(this));
        this.router.post('/logout', this.logout.bind(this));
        this.router.post('/validate', this.validateToken.bind(this));
    }

    private async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                const status = result.error?.code === 'INVALID_CREDENTIALS' ? 401 : 400;
                res.status(status).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await this.authService.register(req.body);

            if (result.success) {
                res.status(201).json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.headers.authorization?.split(' ')[1] || '';
            const result = await this.authService.logout(token);

            if (result.success) {
                res.json({ success: true, message: 'Çıkış başarılı' });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    private async validateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
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
            } else {
                res.status(401).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createAuthController(authService: IAuthService): AuthController {
    return new AuthController(authService);
}
