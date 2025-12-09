"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const material_repository_1 = require("../material.repository");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('MaterialRepository', () => {
    let repository;
    let prisma;
    let prismaMaterial;
    let prismaThickness;
    beforeEach(() => {
        prisma = (0, jest_mock_extended_1.mock)();
        prismaMaterial = (0, jest_mock_extended_1.mock)();
        prismaThickness = (0, jest_mock_extended_1.mock)();
        prisma.materialType = prismaMaterial;
        prisma.thicknessRange = prismaThickness;
        repository = new material_repository_1.MaterialRepository(prisma);
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
//# sourceMappingURL=material.repository.spec.js.map