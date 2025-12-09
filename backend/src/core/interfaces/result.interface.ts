/**
 * Result Pattern Interfaces
 * For consistent error handling across services
 */

export interface IResult<T> {
    success: boolean;
    data?: T;
    error?: IError;
}

export interface IError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export function success<T>(data: T): IResult<T> {
    return { success: true, data };
}

export function failure<T>(error: IError): IResult<T> {
    return { success: false, error };
}
