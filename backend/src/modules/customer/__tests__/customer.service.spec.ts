/**
 * Customer Service Tests
 * Tests CRUD operations and business logic
 */

import { CustomerService } from '../customer.service';
import { ICustomerRepository, CustomerWithRelations } from '../customer.repository';

// ==================== MOCK FACTORY ====================

const createMockCustomer = (overrides: Partial<CustomerWithRelations> = {}): CustomerWithRelations => ({
    id: 'cust-123',
    code: 'C001',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '555-0100',
    address: '123 Test St',
    taxId: 'TAX123',
    customFields: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { orders: 0 },
    ...overrides
});

const createMockRepository = (): jest.Mocked<ICustomerRepository> => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
});

// ==================== TESTS ====================

describe('CustomerService', () => {
    let service: CustomerService;
    let mockRepository: jest.Mocked<ICustomerRepository>;

    beforeEach(() => {
        mockRepository = createMockRepository();
        service = new CustomerService(mockRepository);
    });

    describe('getCustomers', () => {
        it('should return all customers', async () => {
            const customers = [createMockCustomer(), createMockCustomer({ id: 'cust-456', code: 'C002' })];
            mockRepository.findAll.mockResolvedValue(customers);

            const result = await service.getCustomers();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);
        });

        it('should return failure on error', async () => {
            mockRepository.findAll.mockRejectedValue(new Error('DB error'));

            const result = await service.getCustomers();

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('CUSTOMER_FETCH_ERROR');
        });
    });

    describe('getCustomerById', () => {
        it('should return customer by ID', async () => {
            mockRepository.findById.mockResolvedValue(createMockCustomer());

            const result = await service.getCustomerById('cust-123');

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('cust-123');
        });

        it('should return failure if not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.getCustomerById('non-existent');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('CUSTOMER_NOT_FOUND');
        });
    });

    describe('createCustomer', () => {
        it('should create customer successfully', async () => {
            const customer = createMockCustomer();
            mockRepository.findByCode.mockResolvedValue(null);
            mockRepository.create.mockResolvedValue(customer);
            mockRepository.findById.mockResolvedValue(customer);

            const result = await service.createCustomer({
                code: 'C001',
                name: 'Test Customer'
            });

            expect(result.success).toBe(true);
            expect(result.data?.code).toBe('C001');
        });

        it('should fail if code is empty', async () => {
            const result = await service.createCustomer({
                code: '',
                name: 'Test'
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('VALIDATION_ERROR');
        });

        it('should fail if name is empty', async () => {
            const result = await service.createCustomer({
                code: 'C001',
                name: ''
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('VALIDATION_ERROR');
        });

        it('should fail on duplicate code', async () => {
            mockRepository.findByCode.mockResolvedValue(createMockCustomer());

            const result = await service.createCustomer({
                code: 'C001',
                name: 'Test'
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('DUPLICATE_CODE');
        });
    });

    describe('updateCustomer', () => {
        it('should update customer successfully', async () => {
            const customer = createMockCustomer();
            const updatedCustomer = { ...customer, name: 'Updated Name' };
            mockRepository.findById
                .mockResolvedValueOnce(customer)
                .mockResolvedValueOnce(updatedCustomer);
            mockRepository.update.mockResolvedValue(updatedCustomer);

            const result = await service.updateCustomer('cust-123', { name: 'Updated Name' });

            expect(result.success).toBe(true);
            expect(result.data?.name).toBe('Updated Name');
        });

        it('should fail if customer not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.updateCustomer('non-existent', { name: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('CUSTOMER_NOT_FOUND');
        });
    });

    describe('deleteCustomer', () => {
        it('should delete customer without orders', async () => {
            mockRepository.findById.mockResolvedValue(createMockCustomer());
            mockRepository.delete.mockResolvedValue(undefined);

            const result = await service.deleteCustomer('cust-123');

            expect(result.success).toBe(true);
            expect(mockRepository.delete).toHaveBeenCalledWith('cust-123');
        });

        it('should fail if customer has orders', async () => {
            mockRepository.findById.mockResolvedValue(
                createMockCustomer({ _count: { orders: 5 } })
            );

            const result = await service.deleteCustomer('cust-123');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('CUSTOMER_HAS_ORDERS');
        });

        it('should fail if customer not found', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await service.deleteCustomer('non-existent');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('CUSTOMER_NOT_FOUND');
        });
    });
});
