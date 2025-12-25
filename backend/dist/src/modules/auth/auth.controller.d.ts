/**
 * Auth Controller
 * Following SRP - Only handles HTTP concerns for authentication
 */
import { Router } from 'express';
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
export declare class AuthController {
    private readonly authService;
    router: Router;
    constructor(authService: IAuthService);
    private initializeRoutes;
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
    private login;
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
    private register;
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
    private logout;
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
    private validateToken;
}
export declare function createAuthController(authService: IAuthService): AuthController;
//# sourceMappingURL=auth.controller.d.ts.map