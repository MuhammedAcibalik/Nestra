"use strict";
/**
 * Order Queries
 * Following CQRS pattern - Queries read state
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetOrderStatisticsQuery = exports.ListOrdersQuery = exports.GetOrderByIdQuery = void 0;
// ==================== GET ORDER BY ID ====================
class GetOrderByIdQuery {
    orderId;
    tenantId;
    constructor(orderId, tenantId) {
        this.orderId = orderId;
        this.tenantId = tenantId;
    }
}
exports.GetOrderByIdQuery = GetOrderByIdQuery;
class ListOrdersQuery {
    tenantId;
    filter;
    options;
    constructor(tenantId, filter, options) {
        this.tenantId = tenantId;
        this.filter = filter;
        this.options = options;
    }
}
exports.ListOrdersQuery = ListOrdersQuery;
class GetOrderStatisticsQuery {
    tenantId;
    fromDate;
    toDate;
    constructor(tenantId, fromDate, toDate) {
        this.tenantId = tenantId;
        this.fromDate = fromDate;
        this.toDate = toDate;
    }
}
exports.GetOrderStatisticsQuery = GetOrderStatisticsQuery;
//# sourceMappingURL=queries.js.map