/**
 * Swagger/OpenAPI Configuration
 * Security-focused API documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
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

export const swaggerSpec = swaggerJsdoc(options);
