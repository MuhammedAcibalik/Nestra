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
export declare function success<T>(data: T): IResult<T>;
export declare function failure<T>(error: IError): IResult<T>;
//# sourceMappingURL=result.interface.d.ts.map