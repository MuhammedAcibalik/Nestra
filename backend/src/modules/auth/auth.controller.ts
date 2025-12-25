/**
 * Auth Controller
 * Following SRP - Only handles HTTP concerns for authentication
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IAuthService } from '../../core/interfaces';

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: "******"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *         name:
 *           type: string
 *           minLength: 2
 */

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

    /**
     * @openapi
     * /auth/login:
     *   post:
     *     tags: [Auth]
     *     summary: Kullanıcı girişi
     *     description: Email ve şifre ile JWT token alır
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Başarılı giriş
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LoginResponse'
     *       401:
     *         description: Geçersiz kimlik bilgileri
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       429:
     *         description: Rate limit aşıldı (5 istek/dakika)
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

    /**
     * @openapi
     * /auth/register:
     *   post:
     *     tags: [Auth]
     *     summary: Yeni kullanıcı kaydı
     *     description: Yeni bir kullanıcı hesabı oluşturur
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterRequest'
     *     responses:
     *       201:
     *         description: Kayıt başarılı
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LoginResponse'
     *       400:
     *         description: Geçersiz istek veya email zaten kayıtlı
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

    /**
     * @openapi
     * /auth/logout:
     *   post:
     *     tags: [Auth]
     *     summary: Oturumu kapat
     *     description: Mevcut JWT token'ı geçersiz kılar
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Çıkış başarılı
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: Çıkış başarılı
     *       400:
     *         description: Token geçersiz
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

    /**
     * @openapi
     * /auth/validate:
     *   post:
     *     tags: [Auth]
     *     summary: Token doğrulama
     *     description: JWT token'ın geçerliliğini kontrol eder
     *     security:
     *       - BearerAuth: []
     *     responses:
     *       200:
     *         description: Token geçerli
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     userId:
     *                       type: string
     *                       format: uuid
     *                     email:
     *                       type: string
     *                     role:
     *                       type: string
     *       401:
     *         description: Token geçersiz veya süresi dolmuş
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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
