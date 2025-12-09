/**
 * Location Service
 * Following SOLID principles with proper types
 */

import {
    IResult,
    success,
    failure
} from '../../core/interfaces';
import {
    ILocationRepository,
    LocationWithRelations,
    ILocationFilter,
    ICreateLocationInput,
    IUpdateLocationInput
} from './location.repository';

export interface ILocationDto {
    id: string;
    name: string;
    description?: string;
    address?: string;
    stockItemCount: number;
    machineCount: number;
    createdAt: Date;
}

export interface ILocationService {
    getLocations(filter?: ILocationFilter): Promise<IResult<ILocationDto[]>>;
    getLocationById(id: string): Promise<IResult<ILocationDto>>;
    createLocation(data: ICreateLocationInput): Promise<IResult<ILocationDto>>;
    updateLocation(id: string, data: IUpdateLocationInput): Promise<IResult<ILocationDto>>;
    deleteLocation(id: string): Promise<IResult<void>>;
}

export class LocationService implements ILocationService {
    constructor(private readonly repository: ILocationRepository) { }

    async getLocations(filter?: ILocationFilter): Promise<IResult<ILocationDto[]>> {
        try {
            const locations = await this.repository.findAll(filter);
            const dtos = locations.map((l) => this.toDto(l));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'LOCATION_FETCH_ERROR',
                message: 'Lokasyonlar getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getLocationById(id: string): Promise<IResult<ILocationDto>> {
        try {
            const location = await this.repository.findById(id);

            if (!location) {
                return failure({
                    code: 'LOCATION_NOT_FOUND',
                    message: 'Lokasyon bulunamadı'
                });
            }

            return success(this.toDto(location));
        } catch (error) {
            return failure({
                code: 'LOCATION_FETCH_ERROR',
                message: 'Lokasyon getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async createLocation(data: ICreateLocationInput): Promise<IResult<ILocationDto>> {
        try {
            if (!data.name) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Lokasyon adı zorunludur'
                });
            }

            const existing = await this.repository.findByName(data.name);
            if (existing) {
                return failure({
                    code: 'DUPLICATE_NAME',
                    message: 'Bu lokasyon adı zaten kullanılıyor'
                });
            }

            const location = await this.repository.create(data);
            const fullLocation = await this.repository.findById(location.id);

            return success(this.toDto(fullLocation!));
        } catch (error) {
            return failure({
                code: 'LOCATION_CREATE_ERROR',
                message: 'Lokasyon oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async updateLocation(id: string, data: IUpdateLocationInput): Promise<IResult<ILocationDto>> {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return failure({
                    code: 'LOCATION_NOT_FOUND',
                    message: 'Lokasyon bulunamadı'
                });
            }

            if (data.name && data.name !== existing.name) {
                const duplicate = await this.repository.findByName(data.name);
                if (duplicate) {
                    return failure({
                        code: 'DUPLICATE_NAME',
                        message: 'Bu lokasyon adı zaten kullanılıyor'
                    });
                }
            }

            const location = await this.repository.update(id, data);
            const fullLocation = await this.repository.findById(location.id);

            return success(this.toDto(fullLocation!));
        } catch (error) {
            return failure({
                code: 'LOCATION_UPDATE_ERROR',
                message: 'Lokasyon güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async deleteLocation(id: string): Promise<IResult<void>> {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return failure({
                    code: 'LOCATION_NOT_FOUND',
                    message: 'Lokasyon bulunamadı'
                });
            }

            const hasItems = (existing._count?.stockItems ?? 0) > 0;
            const hasMachines = (existing._count?.machines ?? 0) > 0;

            if (hasItems || hasMachines) {
                return failure({
                    code: 'LOCATION_IN_USE',
                    message: 'Bu lokasyona bağlı stok veya makine var, silinemez'
                });
            }

            await this.repository.delete(id);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'LOCATION_DELETE_ERROR',
                message: 'Lokasyon silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private toDto(location: LocationWithRelations): ILocationDto {
        return {
            id: location.id,
            name: location.name,
            description: location.description ?? undefined,
            address: location.address ?? undefined,
            stockItemCount: location._count?.stockItems ?? 0,
            machineCount: location._count?.machines ?? 0,
            createdAt: location.createdAt
        };
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
