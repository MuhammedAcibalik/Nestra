import { MaterialRepository } from '../material.repository';
import { PrismaClient } from '@prisma/client';
import { mock, MockProxy } from 'jest-mock-extended';

describe('MaterialRepository', () => {
    let repository: MaterialRepository;
    let prisma: MockProxy<PrismaClient>;
    let prismaMaterial: any;
    let prismaThickness: any;

    beforeEach(() => {
        prisma = mock<PrismaClient>();
        prismaMaterial = mock<any>();
        prismaThickness = mock<any>();
        (prisma as any).materialType = prismaMaterial;
        (prisma as any).thicknessRange = prismaThickness;
        repository = new MaterialRepository(prisma);
    });

    describe('findAll', () => {
        it('should return all materials with relations', async () => {
            const mockMaterials = [{ id: 'm1', name: 'MDF' }];
            prismaMaterial.findMany.mockResolvedValue(mockMaterials);

            const result = await repository.findAll();

            expect(result).toEqual(mockMaterials);
            expect(prismaMaterial.findMany).toHaveBeenCalledWith({
                include: {
                    thicknessRanges: true,
                    _count: { select: { stockItems: true } }
                },
                orderBy: { name: 'asc' }
            });
        });
    });

    describe('create', () => {
        it('should create material', async () => {
            const input = { name: 'MDF', isRotatable: true };
            const mockMaterial = { id: 'm1', ...input };

            prismaMaterial.create.mockResolvedValue(mockMaterial);

            const result = await repository.create(input);

            expect(result).toEqual(mockMaterial);
            expect(prismaMaterial.create).toHaveBeenCalledWith({
                data: {
                    name: input.name,
                    description: undefined,
                    isRotatable: true,
                    defaultDensity: undefined
                }
            });
        });
    });

    describe('addThicknessRange', () => {
        it('should add thickness range', async () => {
            const input = { name: '18mm', minThickness: 17.5, maxThickness: 18.5 };
            const mockRange = { id: 'tr1', materialTypeId: 'm1', ...input };

            prismaThickness.create.mockResolvedValue(mockRange);

            const result = await repository.addThicknessRange('m1', input);

            expect(result).toEqual(mockRange);
            expect(prismaThickness.create).toHaveBeenCalledWith({
                data: {
                    materialTypeId: 'm1',
                    name: input.name,
                    minThickness: input.minThickness,
                    maxThickness: input.maxThickness
                }
            });
        });
    });
});
