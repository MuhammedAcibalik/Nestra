"use strict";
/**
 * Location Service
 * Following SOLID principles with proper types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const interfaces_1 = require("../../core/interfaces");
class LocationService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getLocations(filter) {
        try {
            const locations = await this.repository.findAll(filter);
            const dtos = locations.map((l) => this.toDto(l));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'LOCATION_FETCH_ERROR',
                message: 'Lokasyonlar getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getLocationById(id) {
        try {
            const location = await this.repository.findById(id);
            if (!location) {
                return (0, interfaces_1.failure)({
                    code: 'LOCATION_NOT_FOUND',
                    message: 'Lokasyon bulunamadı'
                });
            }
            return (0, interfaces_1.success)(this.toDto(location));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'LOCATION_FETCH_ERROR',
                message: 'Lokasyon getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async createLocation(data) {
        try {
            if (!data.name) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Lokasyon adı zorunludur'
                });
            }
            const existing = await this.repository.findByName(data.name);
            if (existing) {
                return (0, interfaces_1.failure)({
                    code: 'DUPLICATE_NAME',
                    message: 'Bu lokasyon adı zaten kullanılıyor'
                });
            }
            const location = await this.repository.create(data);
            const fullLocation = await this.repository.findById(location.id);
            return (0, interfaces_1.success)(this.toDto(fullLocation));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'LOCATION_CREATE_ERROR',
                message: 'Lokasyon oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async updateLocation(id, data) {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'LOCATION_NOT_FOUND',
                    message: 'Lokasyon bulunamadı'
                });
            }
            if (data.name && data.name !== existing.name) {
                const duplicate = await this.repository.findByName(data.name);
                if (duplicate) {
                    return (0, interfaces_1.failure)({
                        code: 'DUPLICATE_NAME',
                        message: 'Bu lokasyon adı zaten kullanılıyor'
                    });
                }
            }
            const location = await this.repository.update(id, data);
            const fullLocation = await this.repository.findById(location.id);
            return (0, interfaces_1.success)(this.toDto(fullLocation));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'LOCATION_UPDATE_ERROR',
                message: 'Lokasyon güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async deleteLocation(id) {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'LOCATION_NOT_FOUND',
                    message: 'Lokasyon bulunamadı'
                });
            }
            const hasItems = (existing._count?.stockItems ?? 0) > 0;
            const hasMachines = (existing._count?.machines ?? 0) > 0;
            if (hasItems || hasMachines) {
                return (0, interfaces_1.failure)({
                    code: 'LOCATION_IN_USE',
                    message: 'Bu lokasyona bağlı stok veya makine var, silinemez'
                });
            }
            await this.repository.delete(id);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'LOCATION_DELETE_ERROR',
                message: 'Lokasyon silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    toDto(location) {
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
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.LocationService = LocationService;
//# sourceMappingURL=location.service.js.map