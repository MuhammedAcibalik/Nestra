/**
 * Machine Service Tests
 * Tests CRUD operations, compatibility, and business logic
 */

import { MachineService } from '../machine.service';
import { IMachineRepository, MachineWithRelations, MachineType } from '../machine.repository';

// ==================== MOCK FACTORY ====================

const createMockMachine = (overrides: Partial<MachineWithRelations> = {}): MachineWithRelations => ({
    id: 'mach-123',
    code: 'M001',
    name: 'CNC Router',
    description: 'High precision cutting',
    machineType: 'CNC_2D',
    maxLength: 3000,
    maxWidth: 1500,
    maxHeight: 100,
    minCutLength: 50,
    kerf: 3,
    onlyGuillotine: false,
    isActive: true,
    locationId: 'loc-1',
    location: { id: 'loc-1', name: 'Main Floor' },
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { compatibilities: 5, cuttingPlans: 10 },
    ...overrides
});

const createMockRepository = (): jest.Mocked<IMachineRepository> => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addCompatibility: jest.fn(),
    getCompatibilities: jest.fn(),
    removeCompatibility: jest.fn(),
    findCompatibleMachines: jest.fn()
});

// ==================== TESTS ====================

describe('MachineService', () => {
    let service: MachineService;
    let mockRepository: jest.Mocked<IMachineRepository>;

    beforeEach(() => {
        mockRepository = createMockRepository();
        service = new MachineService(mockRepository);
    });

    describe('getMachines', () => {
        it('should return all machines', async () => {
            const machines = [createMockMachine(), createMockMachine({ id: 'mach-456' })];
            mockRepository.findAll.mockResolvedValue(machines);

            const result = await service.getMachines();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });

        it('should return failure on error', async () => {
            mockRepository.findAll.mockRejectedValue(new Error('DB error'));

            const result = await service.getMachines();

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('MACHINE_FETCH_ERROR');
        });
    });

    describe('getMachineById', () => {
        it('should return machine by ID', async () => {
            mockRepository.findById.mockResolvedValue(createMockMachine());

            const result = await service.getMachineById('mach-123');

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('mach-123');
        });

        it('should return failure if not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.getMachineById('non-existent');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('MACHINE_NOT_FOUND');
        });
    });

    describe('createMachine', () => {
        it('should create machine successfully', async () => {
            const machine = createMockMachine();
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(machine);
            mockRepository.findById.mockResolvedValue(machine);

            const result = await service.createMachine({
                code: 'M001',
                name: 'CNC Router',
                machineType: 'CNC_2D'
            });

            expect(result.success).toBe(true);
            expect(result.data?.code).toBe('M001');
        });

        it('should fail if code is empty', async () => {
            const result = await service.createMachine({
                code: '',
                name: 'Test',
                machineType: 'CNC_2D'
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('VALIDATION_ERROR');
        });

        it('should fail on duplicate code', async () => {
            mockRepository.findByCode.mockResolvedValue(createMockMachine());

            const result = await service.createMachine({
                code: 'M001',
                name: 'Test',
                machineType: 'CNC_2D'
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('DUPLICATE_CODE');
        });
    });

    describe('updateMachine', () => {
        it('should update machine successfully', async () => {
            const machine = createMockMachine();
            const updated = { ...machine, name: 'Updated Router' };
            mockRepository.findById.mockResolvedValueOnce(machine).mockResolvedValueOnce(updated);
            mockRepository.update.mockResolvedValue(updated);

            const result = await service.updateMachine('mach-123', { name: 'Updated Router' });

            expect(result.success).toBe(true);
        });

        it('should fail if machine not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.updateMachine('non-existent', { name: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('MACHINE_NOT_FOUND');
        });
    });

    describe('deleteMachine', () => {
        it('should delete machine without plans', async () => {
            mockRepository.findById.mockResolvedValue(
                createMockMachine({ _count: { compatibilities: 0, cuttingPlans: 0 } })
            );
            mockRepository.delete.mockResolvedValue(undefined);

            const result = await service.deleteMachine('mach-123');

            expect(result.success).toBe(true);
        });

        it('should fail if machine has cutting plans', async () => {
            mockRepository.findById.mockResolvedValue(
                createMockMachine({ _count: { compatibilities: 0, cuttingPlans: 5 } })
            );

            const result = await service.deleteMachine('mach-123');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('MACHINE_HAS_PLANS');
        });

        it('should fail if machine not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.deleteMachine('non-existent');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('MACHINE_NOT_FOUND');
        });
    });

    describe('addCompatibility', () => {
        it('should add compatibility successfully', async () => {
            mockRepository.findById.mockResolvedValue(createMockMachine());
            mockRepository.addCompatibility.mockResolvedValue({
                id: 'compat-1',
                machineId: 'mach-123',
                materialTypeId: 'mat-1',
                thicknessRangeId: null,
                cuttingSpeed: 100,
                costPerUnit: 0.5,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            mockRepository.getCompatibilities.mockResolvedValue([{
                id: 'compat-1',
                machineId: 'mach-123',
                materialTypeId: 'mat-1',
                thicknessRangeId: null,
                cuttingSpeed: 100,
                costPerUnit: 0.5,
                createdAt: new Date(),
                updatedAt: new Date(),
                materialType: { id: 'mat-1', name: 'MDF' },
                thicknessRange: null
            }]);

            const result = await service.addCompatibility('mach-123', {
                materialTypeId: 'mat-1',
                cuttingSpeed: 100
            });

            expect(result.success).toBe(true);
        });

        it('should fail if machine not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.addCompatibility('non-existent', {
                materialTypeId: 'mat-1'
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('MACHINE_NOT_FOUND');
        });
    });

    describe('getCompatibleMachines', () => {
        it('should return compatible machines', async () => {
            const machines = [createMockMachine()];
            mockRepository.findCompatibleMachines.mockResolvedValue(machines);

            const result = await service.getCompatibleMachines('mat-1', 18);

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });
    });
});
