/**
 * Error Handler Middleware Tests
 * Tests error handling, factories, and async handler
 */

import { Request, Response, NextFunction } from 'express';
import {
    errorHandler,
    createError,
    createValidationError,
    createNotFoundError,
    createAuthenticationError,
    createAuthorizationError,
    asyncHandler,
    notFoundHandler,
    AppError,
    ErrorCodes
} from '../errorHandler';

// Mock logger
jest.mock('../../core/logger', () => ({
    createModuleLogger: () => ({
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn()
    })
}));

// Mock Sentry
jest.mock('../../core/error-tracking', () => ({
    captureException: jest.fn()
}));

describe('ErrorHandler Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonSpy: jest.Mock;
    let statusSpy: jest.Mock;

    beforeEach(() => {
        jsonSpy = jest.fn();
        statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
        mockReq = {
            path: '/test',
            method: 'GET',
            ip: '127.0.0.1',
            headers: { 'x-request-id': 'test-123' }
        };
        mockRes = {
            status: statusSpy
        };
        mockNext = jest.fn();
    });

    describe('errorHandler', () => {
        it('should handle 500 errors with logging', () => {
            const error: AppError = new Error('Server error');
            error.statusCode = 500;
            error.code = 'INTERNAL_ERROR';

            errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'INTERNAL_ERROR',
                        message: 'Server error'
                    })
                })
            );
        });

        it('should handle 400 errors as client errors', () => {
            const error = createValidationError('Invalid input');

            errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(400);
        });

        it('should include request ID in response', () => {
            const error = createError('Test error', 400);

            errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

            expect(jsonSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    requestId: 'test-123'
                })
            );
        });

        it('should default to 500 if no statusCode', () => {
            const error: AppError = new Error('Unknown error');

            errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

            expect(statusSpy).toHaveBeenCalledWith(500);
        });
    });

    describe('Error Factories', () => {
        it('createError should create error with correct properties', () => {
            const error = createError('Test message', 418, 'TEAPOT');

            expect(error.message).toBe('Test message');
            expect(error.statusCode).toBe(418);
            expect(error.code).toBe('TEAPOT');
            expect(error.isOperational).toBe(true);
        });

        it('createValidationError should use VALIDATION code', () => {
            const error = createValidationError('Invalid data', { field: 'email' });

            expect(error.statusCode).toBe(ErrorCodes.VALIDATION.status);
            expect(error.code).toBe(ErrorCodes.VALIDATION.code);
            expect(error.details).toEqual({ field: 'email' });
        });

        it('createNotFoundError should format message correctly', () => {
            const error = createNotFoundError('User');

            expect(error.message).toBe('User not found');
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
        });

        it('createAuthenticationError should use default message', () => {
            const error = createAuthenticationError();

            expect(error.message).toBe('Authentication required');
            expect(error.statusCode).toBe(401);
        });

        it('createAuthorizationError should use custom message', () => {
            const error = createAuthorizationError('Admin only');

            expect(error.message).toBe('Admin only');
            expect(error.statusCode).toBe(403);
        });
    });

    describe('asyncHandler', () => {
        it('should pass successful promise through', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const wrapped = asyncHandler(handler);

            await wrapped(mockReq as Request, mockRes as Response, mockNext);

            expect(handler).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should catch errors and pass to next', async () => {
            const error = new Error('Async error');
            const handler = jest.fn().mockRejectedValue(error);
            const wrapped = asyncHandler(handler);

            await wrapped(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('notFoundHandler', () => {
        it('should call next with 404 error', () => {
            notFoundHandler(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 404,
                    code: 'NOT_FOUND'
                })
            );
        });
    });
});
