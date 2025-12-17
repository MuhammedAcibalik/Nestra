"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const material_repository_1 = require("../material.repository");
const db_mock_1 = require("../../../core/test/db-mock");
describe('MaterialRepository', () => {
    let repository;
    let db;
    beforeEach(() => {
        db = (0, db_mock_1.createMockDatabase)();
        repository = new material_repository_1.MaterialRepository(db);
    });
    describe('findAll', () => {
        it('should return all materials with relations', async () => {
            const mockMaterials = [{ id: 'm1', name: 'MDF', thicknessRanges: [], _count: { stockItems: 0 } }];
            db.query.materialTypes.findMany.mockResolvedValue(mockMaterials);
            const result = await repository.findAll();
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('MDF');
        });
    });
    describe('create', () => {
        it('should create material', async () => {
            const input = { name: 'MDF', isRotatable: true };
            const mockMaterial = { id: 'm1', ...input };
            db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockMaterial])
                })
            });
            const result = await repository.create(input);
            expect(result).toEqual(mockMaterial);
            expect(db.insert).toHaveBeenCalled();
        });
    });
    describe('addThicknessRange', () => {
        it('should add thickness range', async () => {
            const input = { name: '18mm', minThickness: 17.5, maxThickness: 18.5 };
            const mockRange = { id: 'tr1', materialTypeId: 'm1', ...input };
            db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockRange])
                })
            });
            const result = await repository.addThicknessRange('m1', input);
            expect(result).toEqual(mockRange);
        });
    });
});
//# sourceMappingURL=material.repository.spec.js.map