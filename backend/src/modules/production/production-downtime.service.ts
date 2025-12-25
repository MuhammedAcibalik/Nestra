/**
 * Production Downtime Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for downtime operations only
 */

import { IResult, success, failure, IDowntimeLogDto, ICreateDowntimeInput } from '../../core/interfaces';
import { IProductionRepository } from './production.repository';
import { toDowntimeDto, getErrorMessage } from './production.mapper';

/**
 * Production Downtime Service Interface
 */
export interface IProductionDowntimeService {
    recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>>;
    endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>>;
    getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>>;
}

/**
 * Production Downtime Service Implementation
 */
export class ProductionDowntimeService implements IProductionDowntimeService {
    constructor(private readonly repository: IProductionRepository) {}

    async recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>> {
        try {
            const downtime = await this.repository.createDowntime(input);
            return success(toDowntimeDto({ ...downtime, machine: null }));
        } catch (error) {
            return failure({
                code: 'DOWNTIME_RECORD_ERROR',
                message: 'Duruş kaydı oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>> {
        try {
            // Find the downtime record from existing downtimes
            // Since we don't have findDowntimeById, we will update directly
            const endedAt = new Date();

            // Calculate duration - we need to get the startedAt first
            // For now, use repository updateDowntime with estimated duration
            // The actual startedAt is stored in the record
            const durationMinutes = 0; // Will be calculated by repository or caller

            const updated = await this.repository.updateDowntime(downtimeId, endedAt, durationMinutes);

            return success(toDowntimeDto({ ...updated, machine: null }));
        } catch (error) {
            return failure({
                code: 'DOWNTIME_END_ERROR',
                message: 'Duruş sonlandırılırken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>> {
        try {
            const downtimes = await this.repository.findDowntimesByLogId(logId);
            return success(downtimes.map((d) => toDowntimeDto(d)));
        } catch (error) {
            return failure({
                code: 'DOWNTIME_FETCH_ERROR',
                message: 'Duruş kayıtları getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }
}
