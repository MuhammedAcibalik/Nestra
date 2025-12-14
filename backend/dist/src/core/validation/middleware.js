"use strict";
/**
 * Validation Middleware
 * Express middleware for request validation using Zod schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateAll = validateAll;
exports.validateId = validateId;
const zod_1 = require("zod");
/**
 * Format Zod errors into a user-friendly format
 */
function formatZodErrors(error) {
    return error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
    }));
}
/**
 * Create validation middleware for a specific schema and target
 */
function validate(schema, target = 'body') {
    return (req, res, next) => {
        try {
            const data = req[target];
            const parsed = schema.parse(data);
            // Replace the target with parsed (and transformed) data
            if (target === 'body') {
                req.body = parsed;
            }
            else if (target === 'query') {
                Object.assign(req, { query: parsed });
            }
            else if (target === 'params') {
                Object.assign(req, { params: parsed });
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const response = {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'İstek verisi doğrulama hatası',
                        details: formatZodErrors(error)
                    }
                };
                res.status(400).json(response);
                return;
            }
            // Re-throw non-Zod errors
            next(error);
        }
    };
}
/**
 * Validate multiple targets at once
 */
function validateAll(options) {
    return (req, res, next) => {
        const errors = [];
        try {
            if (options.body) {
                const parsed = options.body.parse(req.body);
                req.body = parsed;
            }
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                errors.push(...formatZodErrors(error).map(e => ({
                    ...e,
                    field: `body.${e.field}`
                })));
            }
        }
        try {
            if (options.query) {
                const parsed = options.query.parse(req.query);
                Object.assign(req, { query: parsed });
            }
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                errors.push(...formatZodErrors(error).map(e => ({
                    ...e,
                    field: `query.${e.field}`
                })));
            }
        }
        try {
            if (options.params) {
                const parsed = options.params.parse(req.params);
                Object.assign(req, { params: parsed });
            }
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                errors.push(...formatZodErrors(error).map(e => ({
                    ...e,
                    field: `params.${e.field}`
                })));
            }
        }
        if (errors.length > 0) {
            const response = {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'İstek verisi doğrulama hatası',
                    details: errors
                }
            };
            res.status(400).json(response);
            return;
        }
        next();
    };
}
/**
 * Helper to validate UUID params
 */
function validateId(paramName = 'id') {
    return (req, res, next) => {
        const id = req.params[paramName];
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!id || !uuidRegex.test(id)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: `Geçersiz ${paramName} formatı`,
                    details: [{ field: paramName, message: 'Geçerli bir UUID olmalıdır' }]
                }
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=middleware.js.map