"use strict";
/**
 * Base Repository Interface
 * Following Dependency Inversion Principle (DIP)
 * High-level modules should not depend on low-level modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeSpecification = void 0;
class CompositeSpecification {
    and(other) {
        return new AndSpecification(this, other);
    }
    or(other) {
        return new OrSpecification(this, other);
    }
    not() {
        return new NotSpecification(this);
    }
}
exports.CompositeSpecification = CompositeSpecification;
class AndSpecification extends CompositeSpecification {
    left;
    right;
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }
    isSatisfiedBy(entity) {
        return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
    }
    toQuery() {
        return { AND: [this.left.toQuery(), this.right.toQuery()] };
    }
}
class OrSpecification extends CompositeSpecification {
    left;
    right;
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }
    isSatisfiedBy(entity) {
        return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
    }
    toQuery() {
        return { OR: [this.left.toQuery(), this.right.toQuery()] };
    }
}
class NotSpecification extends CompositeSpecification {
    spec;
    constructor(spec) {
        super();
        this.spec = spec;
    }
    isSatisfiedBy(entity) {
        return !this.spec.isSatisfiedBy(entity);
    }
    toQuery() {
        return { NOT: this.spec.toQuery() };
    }
}
//# sourceMappingURL=repository.interface.js.map