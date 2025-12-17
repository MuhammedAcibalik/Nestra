"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const import_service_1 = require("../import.service");
const xlsx = __importStar(require("xlsx"));
const jest_mock_extended_1 = require("jest-mock-extended");
// Mock xlsx module
jest.mock('xlsx', () => ({
    read: jest.fn(),
    utils: {
        sheet_to_json: jest.fn()
    }
}));
describe('ImportService', () => {
    let service;
    let repository;
    beforeEach(() => {
        repository = (0, jest_mock_extended_1.mock)();
        service = new import_service_1.ImportService(repository);
        jest.clearAllMocks();
    });
    describe('detectFileType', () => {
        it('should detect file types correctly', () => {
            expect(service.detectFileType('test.xlsx')).toBe('excel');
            expect(service.detectFileType('test.xls')).toBe('excel');
            expect(service.detectFileType('test.csv')).toBe('csv');
            expect(service.detectFileType('test.txt')).toBe('unknown');
        });
    });
    describe('suggestMapping', () => {
        it('should suggest mapping based on headers', () => {
            const headers = ['Material', 'Thickness', 'Quantity', 'Length', 'Width'];
            const mapping = service.suggestMapping(headers);
            expect(mapping.materialCode).toBe('Material');
            expect(mapping.thickness).toBe('Thickness');
            expect(mapping.quantity).toBe('Quantity');
            expect(mapping.length).toBe('Length');
            expect(mapping.width).toBe('Width');
        });
    });
    describe('importFromExcel', () => {
        it('should import order from excel data', async () => {
            // Mock xlsx behavior
            xlsx.read.mockReturnValue({
                SheetNames: ['Sheet1'],
                Sheets: { 'Sheet1': {} }
            });
            xlsx.utils.sheet_to_json.mockReturnValue([
                { 'Malzeme': 'MDF', 'Kalınlık': 18, 'Adet': 2, 'Boy': 100, 'En': 50 }
            ]);
            // Mock repository methods
            repository.getOrderCount.mockResolvedValue(0);
            repository.createOrderWithItems.mockResolvedValue({
                id: 'order-1',
                orderNumber: 'ORD-2023-00001'
            });
            const buffer = Buffer.from('');
            const options = {
                mapping: {
                    materialCode: 'Malzeme',
                    thickness: 'Kalınlık',
                    quantity: 'Adet',
                    length: 'Boy',
                    width: 'En'
                }
            };
            const result = await service.importFromExcel(buffer, options, 'user-1');
            expect(result.success).toBe(true);
            expect(result.data?.importedItems).toBe(1);
            expect(repository.createOrderWithItems).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=import.service.spec.js.map