import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'jest-mock-extended';
export type Context = {
    prisma: DeepMockProxy<PrismaClient>;
};
export type MockContext = {
    prisma: DeepMockProxy<PrismaClient>;
};
export declare const createMockContext: () => MockContext;
//# sourceMappingURL=prisma-mock.d.ts.map