/**
 * Production Quality Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for quality check operations only
 */

import { IResult, success, failure, IQualityCheckDto, ICreateQualityCheckInput } from '../../core/interfaces';
import { IProductionRepository } from './production.repository';
import { toQualityCheckDto, getErrorMessage } from './production.mapper';

/**
 * Production Quality Service Interface
 */
export interface IProductionQualityService {
    recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>>;
    getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>>;
}

/**
 * Production Quality Service Implementation
 */
export class ProductionQualityService implements IProductionQualityService {
    constructor(private readonly repository: IProductionRepository) { }

    async recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>> {
        try {
            const qc = await this.repository.createQualityCheck(input);
            return success(toQualityCheckDto({ ...qc, inspector: null }));
        } catch (error) {
            return failure({
                code: 'QC_RECORD_ERROR',
                message: 'Kalite kontrol kaydı oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>> {
        try {
            const checks = await this.repository.findQualityChecksByLogId(logId);
            return success(checks.map((c) => toQualityCheckDto(c)));
        } catch (error) {
            return failure({
                code: 'QC_FETCH_ERROR',
                message: 'Kalite kontrol kayıtları getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }
}
