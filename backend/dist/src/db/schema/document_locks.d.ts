/**
 * Drizzle ORM - Document Locks Table
 * Pessimistic locking for real-time collaboration
 */
export type LockableDocumentType = 'cutting_plan' | 'optimization_scenario' | 'order' | 'cutting_job' | 'stock_item';
export interface ILockMetadata {
    readonly clientId?: string;
    readonly browserInfo?: string;
    readonly reason?: string;
    readonly [key: string]: unknown;
}
export declare const documentLocks: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "document_locks";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "document_locks";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        tenantId: import("drizzle-orm/pg-core").PgColumn<{
            name: "tenant_id";
            tableName: "document_locks";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        documentType: import("drizzle-orm/pg-core").PgColumn<{
            name: "document_type";
            tableName: "document_locks";
            dataType: "string";
            columnType: "PgText";
            data: LockableDocumentType;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: LockableDocumentType;
        }>;
        documentId: import("drizzle-orm/pg-core").PgColumn<{
            name: "document_id";
            tableName: "document_locks";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lockedById: import("drizzle-orm/pg-core").PgColumn<{
            name: "locked_by_id";
            tableName: "document_locks";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lockedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "locked_at";
            tableName: "document_locks";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        expiresAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "expires_at";
            tableName: "document_locks";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lastHeartbeat: import("drizzle-orm/pg-core").PgColumn<{
            name: "last_heartbeat";
            tableName: "document_locks";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        metadata: import("drizzle-orm/pg-core").PgColumn<{
            name: "metadata";
            tableName: "document_locks";
            dataType: "json";
            columnType: "PgJsonb";
            data: ILockMetadata;
            driverParam: unknown;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: ILockMetadata;
        }>;
    };
    dialect: "pg";
}>;
export declare const documentLocksRelations: import("drizzle-orm").Relations<"document_locks", {
    tenant: import("drizzle-orm").One<"tenants", true>;
    lockedBy: import("drizzle-orm").One<"users", true>;
}>;
export type DocumentLock = typeof documentLocks.$inferSelect;
export type NewDocumentLock = typeof documentLocks.$inferInsert;
//# sourceMappingURL=document_locks.d.ts.map