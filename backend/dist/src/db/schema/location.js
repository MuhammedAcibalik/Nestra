"use strict";
/**
 * Drizzle ORM - Location Table
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationsRelations = exports.locations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.locations = (0, pg_core_1.pgTable)('locations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').unique().notNull(),
    description: (0, pg_core_1.text)('description'),
    address: (0, pg_core_1.text)('address'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.locationsRelations = (0, drizzle_orm_1.relations)(exports.locations, ({ many }) => ({
// Relations will be defined in respective files to avoid circular imports
}));
//# sourceMappingURL=location.js.map