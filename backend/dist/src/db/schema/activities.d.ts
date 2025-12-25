/**
 * Drizzle ORM - Activities Table
 * Activity feed for real-time collaboration
 */
export type ActivityType = 'order_created' | 'order_updated' | 'order_cancelled' | 'order_completed' | 'cutting_job_created' | 'cutting_job_assigned' | 'cutting_job_started' | 'optimization_started' | 'optimization_completed' | 'optimization_failed' | 'plan_approved' | 'plan_rejected' | 'plan_exported' | 'production_started' | 'production_paused' | 'production_completed' | 'stock_alert' | 'stock_replenished' | 'machine_alert' | 'machine_maintenance' | 'comment_added' | 'mention' | 'user_joined' | 'user_invited';
export interface IActivityMetadata {
    readonly targetName?: string;
    readonly previousValue?: unknown;
    readonly newValue?: unknown;
    readonly description?: string;
    readonly mentionedUserIds?: string[];
    readonly [key: string]: unknown;
}
export declare const activities: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activities";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "activities";
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
            tableName: "activities";
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
        actorId: import("drizzle-orm/pg-core").PgColumn<{
            name: "actor_id";
            tableName: "activities";
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
        activityType: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_type";
            tableName: "activities";
            dataType: "string";
            columnType: "PgText";
            data: ActivityType;
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
            $type: ActivityType;
        }>;
        targetType: import("drizzle-orm/pg-core").PgColumn<{
            name: "target_type";
            tableName: "activities";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        targetId: import("drizzle-orm/pg-core").PgColumn<{
            name: "target_id";
            tableName: "activities";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
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
            tableName: "activities";
            dataType: "json";
            columnType: "PgJsonb";
            data: IActivityMetadata;
            driverParam: unknown;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: IActivityMetadata;
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "activities";
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
    };
    dialect: "pg";
}>;
export declare const activitiesRelations: import("drizzle-orm").Relations<"activities", {
    tenant: import("drizzle-orm").One<"tenants", true>;
    actor: import("drizzle-orm").One<"users", true>;
    readStatuses: import("drizzle-orm").Many<"activity_read_status">;
}>;
export declare const activityReadStatus: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "activity_read_status";
    schema: undefined;
    columns: {
        activityId: import("drizzle-orm/pg-core").PgColumn<{
            name: "activity_id";
            tableName: "activity_read_status";
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
        userId: import("drizzle-orm/pg-core").PgColumn<{
            name: "user_id";
            tableName: "activity_read_status";
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
        readAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "read_at";
            tableName: "activity_read_status";
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
    };
    dialect: "pg";
}>;
export declare const activityReadStatusRelations: import("drizzle-orm").Relations<"activity_read_status", {
    activity: import("drizzle-orm").One<"activities", true>;
    user: import("drizzle-orm").One<"users", true>;
}>;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type ActivityReadStatusRecord = typeof activityReadStatus.$inferSelect;
//# sourceMappingURL=activities.d.ts.map