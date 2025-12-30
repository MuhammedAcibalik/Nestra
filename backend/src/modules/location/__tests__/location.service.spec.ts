/**
 * Location Service Tests
 * Tests CRUD operations and business logic
 */

import { LocationService } from '../location.service';
import { ILocationRepository, LocationWithRelations } from '../location.repository';

// ==================== MOCK FACTORY ====================

const createMockLocation = (overrides: Partial<LocationWithRelations> = {}): LocationWithRelations => ({
    id: 'loc-123',
    name: 'Main Warehouse',
    description: 'Primary storage facility',
    address: '456 Industrial Ave',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { stockItems: 0, machines: 0 },
    ...overrides
});

const createMockRepository = (): jest.Mocked<ILocationRepository> => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
});

// ==================== TESTS ====================

describe('LocationService', () => {
    let service: LocationService;
    let mockRepository: jest.Mocked<ILocationRepository>;

    beforeEach(() => {
        mockRepository = createMockRepository();
        service = new LocationService(mockRepository);
    });

    describe('getLocations', () => {
        it('should return all locations', async () => {
            const locations = [createMockLocation(), createMockLocation({ id: 'loc-456' })];
            mockRepository.findAll.mockResolvedValue(locations);

            const result = await service.getLocations();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });

        it('should return failure on error', async () => {
            mockRepository.findAll.mockRejectedValue(new Error('DB error'));

            const result = await service.getLocations();

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('LOCATION_FETCH_ERROR');
        });
    });

    describe('getLocationById', () => {
        it('should return location by ID', async () => {
            mockRepository.findById.mockResolvedValue(createMockLocation());

            const result = await service.getLocationById('loc-123');

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('loc-123');
        });

        it('should return failure if not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.getLocationById('non-existent');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('LOCATION_NOT_FOUND');
        });
    });

    describe('createLocation', () => {
        it('should create location successfully', async () => {
            const location = createMockLocation();
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(location);
            mockRepository.findById.mockResolvedValue(location);

            const result = await service.createLocation({ name: 'Main Warehouse' });

            expect(result.success).toBe(true);
            expect(result.data?.name).toBe('Main Warehouse');
        });

        it('should fail if name is empty', async () => {
            const result = await service.createLocation({ name: '' });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('VALIDATION_ERROR');
        });

        it('should fail on duplicate name', async () => {
            mockRepository.findByName.mockResolvedValue(createMockLocation());

            const result = await service.createLocation({ name: 'Main Warehouse' });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('DUPLICATE_NAME');
        });
    });

    describe('updateLocation', () => {
        it('should update location successfully', async () => {
            const location = createMockLocation();
            const updated = { ...location, name: 'Updated Warehouse' };
            mockRepository.findById.mockResolvedValueOnce(location).mockResolvedValueOnce(updated);
            mockRepository.findByName.mockResolvedValue(null);
            mockRepository.update.mockResolvedValue(updated);

            const result = await service.updateLocation('loc-123', { name: 'Updated Warehouse' });

            expect(result.success).toBe(true);
        });

        it('should fail if location not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.updateLocation('non-existent', { name: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('LOCATION_NOT_FOUND');
        });

        it('should fail on duplicate name', async () => {
            const location = createMockLocation();
            mockRepository.findById.mockResolvedValue(location);
            mockRepository.findByName.mockResolvedValue(createMockLocation({ id: 'other-loc' }));

            const result = await service.updateLocation('loc-123', { name: 'Other Location' });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('DUPLICATE_NAME');
        });
    });

    describe('deleteLocation', () => {
        it('should delete empty location', async () => {
            mockRepository.findById.mockResolvedValue(createMockLocation());
            mockRepository.delete.mockResolvedValue(undefined);

            const result = await service.deleteLocation('loc-123');

            expect(result.success).toBe(true);
        });

        it('should fail if location has stock items', async () => {
            mockRepository.findById.mockResolvedValue(
                createMockLocation({ _count: { stockItems: 5, machines: 0 } })
            );

            const result = await service.deleteLocation('loc-123');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('LOCATION_IN_USE');
        });

        it('should fail if location has machines', async () => {
            mockRepository.findById.mockResolvedValue(
                createMockLocation({ _count: { stockItems: 0, machines: 2 } })
            );

            const result = await service.deleteLocation('loc-123');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('LOCATION_IN_USE');
        });

        it('should fail if location not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.deleteLocation('non-existent');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('LOCATION_NOT_FOUND');
        });
    });
});
