/**
 * Customer Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { Customer, ICustomerRepository, ICustomerFilter, ICreateCustomerInput, IUpdateCustomerInput } from './interfaces';
export declare class CustomerRepository implements ICustomerRepository {
    private readonly db;
    constructor(db: Database);
    findById(id: string): Promise<Customer | null>;
    findByCode(code: string): Promise<Customer | null>;
    findAll(filter?: ICustomerFilter): Promise<Customer[]>;
    create(data: ICreateCustomerInput): Promise<Customer>;
    update(id: string, data: IUpdateCustomerInput): Promise<Customer>;
    delete(id: string): Promise<void>;
}
export type { Customer, CustomerWithRelations, ICustomerRepository, ICustomerFilter, ICreateCustomerInput, IUpdateCustomerInput } from './interfaces';
//# sourceMappingURL=customer.repository.d.ts.map