import { MaterialService } from '../material.service';
import { IMaterialRepository } from '../material.repository';
import { mock, MockProxy } from 'jest-mock-extended';

describe('MaterialService', () => {
    let service: MaterialService;
    let repository: MockProxy<IMaterialRepository>;

    beforeEach(() => {
        repository = mock<IMaterialRepository>();
        service = new MaterialService(repository);
    });

    describe('getMaterials', () => {
        it('should return all materials', async () => {
            const materials = [
                { id: '1', name: 'MDF', isRotatable: true },
                { id: '2', name: 'Sunta', isRotatable: false }
            ];
            repository.findAll.mockResolvedValue(materials as any);

            const result = await service.getMaterials();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
            expect(result.data?.[0].name).toBe('MDF');
        });
    });

    describe('createMaterial', () => {
        it('should create material successfully', async () => {
            const input = { name: 'MDF', isRotatable: true };
            const saved = { id: '1', ...input };

            repository.findByName.mockResolvedValue(null);
            repository.create.mockResolvedValue(saved as any);
            repository.findById.mockResolvedValue(saved as any);

            const result = await service.createMaterial(input);

            expect(result.success).toBe(true);
            expect(result.data?.name).toBe('MDF');
            expect(repository.create).toHaveBeenCalledWith(input);
        });

        it('should fail if name is empty', async () => {
            const result = await service.createMaterial({ name: '', isRotatable: true });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('VALIDATION_ERROR');
        });

        it('should fail if duplicate name', async () => {
            repository.findByName.mockResolvedValue({ id: '1', name: 'MDF' } as any);
            const result = await service.createMaterial({ name: 'MDF', isRotatable: true });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('DUPLICATE_MATERIAL');
        });
    });

    describe('deleteMaterial', () => {
        it('should delete if no stock', async () => {
            repository.findById.mockResolvedValue({
                id: '1',
                _count: { stockItems: 0 }
            } as any);

            const result = await service.deleteMaterial('1');

            expect(result.success).toBe(true);
            expect(repository.delete).toHaveBeenCalledWith('1');
        });

        it('should fail if has stock', async () => {
            repository.findById.mockResolvedValue({
                id: '1',
                _count: { stockItems: 5 }
            } as any);

            const result = await service.deleteMaterial('1');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('MATERIAL_HAS_STOCK');
        });

        it('should fail if not found', async () => {
            repository.findById.mockResolvedValue(null);

            const result = await service.deleteMaterial('1');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('MATERIAL_NOT_FOUND');
        });
    });
});
