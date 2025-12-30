"use strict";
/**
 * Swagger/OpenAPI Configuration
 * Security-focused API documentation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'Nestra API',
            version: '1.0.0',
            description: `
# Nestra - Kesim Optimizasyonu ve Üretim Yönetimi API

## Kimlik Doğrulama
Tüm korumalı endpoint'ler JWT token gerektirir.

\`Authorization: Bearer <token>\`

## Rate Limiting
- Auth endpoints: 5 istek/dakika
- Optimization endpoints: 10 istek/dakika
- Diğer: 100 istek/dakika
            `.trim(),
            contact: {
                name: 'Nestra API Desteği'
            },
            license: {
                name: 'Proprietary'
            }
        },
        servers: [
            {
                url: '/api',
                description: 'API Base URL'
            }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: "JWT token ile kimlik doğrulama. Login endpoint'inden alınır."
                }
            },
            schemas: {
                // Common Response Schemas
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'VALIDATION_ERROR' },
                                message: { type: 'string', example: 'Geçersiz istek parametreleri' }
                            }
                        }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'array', items: { type: 'object' } },
                        total: { type: 'integer', example: 100 },
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        totalPages: { type: 'integer', example: 5 }
                    }
                },
                // Common Entity Schemas
                UUID: {
                    type: 'string',
                    format: 'uuid',
                    example: '550e8400-e29b-41d4-a716-446655440000'
                },
                Timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2024-01-15T10:30:00Z'
                },
                // Entity Schemas
                Order: {
                    type: 'object',
                    properties: {
                        id: { $ref: '#/components/schemas/UUID' },
                        orderNumber: { type: 'string', example: 'ORD-2024-001' },
                        customerId: { $ref: '#/components/schemas/UUID' },
                        status: { type: 'string', enum: ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'] },
                        priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
                        dueDate: { $ref: '#/components/schemas/Timestamp' },
                        createdAt: { $ref: '#/components/schemas/Timestamp' },
                        updatedAt: { $ref: '#/components/schemas/Timestamp' }
                    }
                },
                StockItem: {
                    type: 'object',
                    properties: {
                        id: { $ref: '#/components/schemas/UUID' },
                        code: { type: 'string', example: 'STK-001' },
                        materialId: { $ref: '#/components/schemas/UUID' },
                        quantity: { type: 'number', example: 100 },
                        length: { type: 'number', example: 2440 },
                        width: { type: 'number', example: 1220 },
                        thickness: { type: 'number', example: 18 },
                        locationId: { $ref: '#/components/schemas/UUID' }
                    }
                },
                Material: {
                    type: 'object',
                    properties: {
                        id: { $ref: '#/components/schemas/UUID' },
                        name: { type: 'string', example: 'MDF 18mm' },
                        type: { type: 'string', example: 'SHEET' },
                        thickness: { type: 'number', example: 18 },
                        density: { type: 'number', example: 750 }
                    }
                },
                OptimizationScenario: {
                    type: 'object',
                    properties: {
                        id: { $ref: '#/components/schemas/UUID' },
                        name: { type: 'string', example: 'Batch-2024-01' },
                        status: { type: 'string', enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'] },
                        algorithm: { type: 'string', enum: ['FFD', 'BFD', 'GUILLOTINE', 'BOTTOM_LEFT'] },
                        createdAt: { $ref: '#/components/schemas/Timestamp' }
                    }
                },
                HealthStatus: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                        timestamp: { $ref: '#/components/schemas/Timestamp' },
                        checks: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    status: { type: 'string' },
                                    responseTime: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            },
            parameters: {
                IdPath: {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string', format: 'uuid' },
                    description: "Kayıt ID'si"
                },
                PageQuery: {
                    name: 'page',
                    in: 'query',
                    schema: { type: 'integer', minimum: 1, default: 1 },
                    description: 'Sayfa numarası'
                },
                LimitQuery: {
                    name: 'limit',
                    in: 'query',
                    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    description: 'Sayfa başına kayıt sayısı'
                }
            },
            responses: {
                Unauthorized: {
                    description: 'Kimlik doğrulama gerekli',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: {
                                success: false,
                                error: { code: 'UNAUTHORIZED', message: 'Token geçersiz veya eksik' }
                            }
                        }
                    }
                },
                Forbidden: {
                    description: 'Yetkisiz erişim',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: {
                                success: false,
                                error: { code: 'FORBIDDEN', message: 'Bu işlem için yetkiniz yok' }
                            }
                        }
                    }
                },
                NotFound: {
                    description: 'Kayıt bulunamadı',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: {
                                success: false,
                                error: { code: 'NOT_FOUND', message: 'Kayıt bulunamadı' }
                            }
                        }
                    }
                },
                RateLimited: {
                    description: 'Rate limit aşıldı',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                            example: {
                                success: false,
                                error: { code: 'RATE_LIMITED', message: 'Çok fazla istek gönderildi' }
                            }
                        }
                    }
                }
            }
        },
        security: [{ BearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Kimlik doğrulama işlemleri (Public)' },
            { name: 'Orders', description: 'Sipariş yönetimi' },
            { name: 'CuttingJobs', description: 'Kesim işleri yönetimi' },
            { name: 'Optimization', description: 'Optimizasyon senaryoları ve planlar' },
            { name: 'Stock', description: 'Stok ve envanter yönetimi' },
            { name: 'Materials', description: 'Malzeme tanımları' },
            { name: 'Production', description: 'Üretim takibi' },
            { name: 'Reports', description: 'Raporlama' },
            { name: 'Machines', description: 'Makine yönetimi' },
            { name: 'Customers', description: 'Müşteri yönetimi' },
            { name: 'Locations', description: 'Lokasyon yönetimi' },
            { name: 'Import', description: 'Veri içe aktarma' },
            { name: 'Export', description: 'Veri dışa aktarma' },
            { name: 'Dashboard', description: 'Dashboard verileri' }
        ]
    },
    apis: ['./src/modules/*/*.controller.ts', './src/controllers/*.controller.ts']
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map