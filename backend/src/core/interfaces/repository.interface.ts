/**
 * Base Repository Interface
 * Following Dependency Inversion Principle (DIP)
 * High-level modules should not depend on low-level modules
 */

import { IEntity, IPaginatedResult, IPaginationOptions } from './index';

export interface IBaseRepository<T extends IEntity, CreateInput, UpdateInput> {
    findById(id: string): Promise<T | null>;
    findOne(filter: Partial<T>): Promise<T | null>;
    findMany(filter?: Partial<T>, pagination?: IPaginationOptions): Promise<T[]>;
    findManyPaginated(filter?: Partial<T>, pagination?: IPaginationOptions): Promise<IPaginatedResult<T>>;
    create(data: CreateInput): Promise<T>;
    createMany(data: CreateInput[]): Promise<T[]>;
    update(id: string, data: UpdateInput): Promise<T>;
    updateMany(filter: Partial<T>, data: UpdateInput): Promise<number>;
    delete(id: string): Promise<void>;
    deleteMany(filter: Partial<T>): Promise<number>;
    count(filter?: Partial<T>): Promise<number>;
    exists(filter: Partial<T>): Promise<boolean>;
}

/**
 * Unit of Work Pattern
 * For transaction management across repositories
 */
export interface IUnitOfWork {
    beginTransaction(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    executeInTransaction<T>(work: () => Promise<T>): Promise<T>;
}

/**
 * Specification Pattern
 * For complex query building
 */
export interface ISpecification<T> {
    isSatisfiedBy(entity: T): boolean;
    toQuery(): Record<string, any>;
    and(other: ISpecification<T>): ISpecification<T>;
    or(other: ISpecification<T>): ISpecification<T>;
    not(): ISpecification<T>;
}

export abstract class CompositeSpecification<T> implements ISpecification<T> {
    abstract isSatisfiedBy(entity: T): boolean;
    abstract toQuery(): Record<string, any>;

    and(other: ISpecification<T>): ISpecification<T> {
        return new AndSpecification(this, other);
    }

    or(other: ISpecification<T>): ISpecification<T> {
        return new OrSpecification(this, other);
    }

    not(): ISpecification<T> {
        return new NotSpecification(this);
    }
}

class AndSpecification<T> extends CompositeSpecification<T> {
    constructor(private readonly left: ISpecification<T>, private readonly right: ISpecification<T>) {
        super();
    }

    isSatisfiedBy(entity: T): boolean {
        return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
    }

    toQuery(): Record<string, any> {
        return { AND: [this.left.toQuery(), this.right.toQuery()] };
    }
}

class OrSpecification<T> extends CompositeSpecification<T> {
    constructor(private readonly left: ISpecification<T>, private readonly right: ISpecification<T>) {
        super();
    }

    isSatisfiedBy(entity: T): boolean {
        return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
    }

    toQuery(): Record<string, any> {
        return { OR: [this.left.toQuery(), this.right.toQuery()] };
    }
}

class NotSpecification<T> extends CompositeSpecification<T> {
    constructor(private readonly spec: ISpecification<T>) {
        super();
    }

    isSatisfiedBy(entity: T): boolean {
        return !this.spec.isSatisfiedBy(entity);
    }

    toQuery(): Record<string, any> {
        return { NOT: this.spec.toQuery() };
    }
}
