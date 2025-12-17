"use strict";
/**
 * Installers Module - Barrel Export
 * Provides all module installers for composition root decomposition
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allInstallers = exports.dashboardInstaller = exports.exportInstaller = exports.importInstaller = exports.reportInstaller = exports.locationInstaller = exports.customerInstaller = exports.machineInstaller = exports.cuttingJobInstaller = exports.productionInstaller = exports.optimizationInstaller = exports.orderInstaller = exports.stockInstaller = exports.materialInstaller = exports.authInstaller = void 0;
__exportStar(require("./installer.interface"), exports);
// Module installers
var auth_installer_1 = require("./auth.installer");
Object.defineProperty(exports, "authInstaller", { enumerable: true, get: function () { return auth_installer_1.authInstaller; } });
var material_installer_1 = require("./material.installer");
Object.defineProperty(exports, "materialInstaller", { enumerable: true, get: function () { return material_installer_1.materialInstaller; } });
var stock_installer_1 = require("./stock.installer");
Object.defineProperty(exports, "stockInstaller", { enumerable: true, get: function () { return stock_installer_1.stockInstaller; } });
var order_installer_1 = require("./order.installer");
Object.defineProperty(exports, "orderInstaller", { enumerable: true, get: function () { return order_installer_1.orderInstaller; } });
var optimization_installer_1 = require("./optimization.installer");
Object.defineProperty(exports, "optimizationInstaller", { enumerable: true, get: function () { return optimization_installer_1.optimizationInstaller; } });
var production_installer_1 = require("./production.installer");
Object.defineProperty(exports, "productionInstaller", { enumerable: true, get: function () { return production_installer_1.productionInstaller; } });
var cutting_job_installer_1 = require("./cutting-job.installer");
Object.defineProperty(exports, "cuttingJobInstaller", { enumerable: true, get: function () { return cutting_job_installer_1.cuttingJobInstaller; } });
var machine_installer_1 = require("./machine.installer");
Object.defineProperty(exports, "machineInstaller", { enumerable: true, get: function () { return machine_installer_1.machineInstaller; } });
var customer_installer_1 = require("./customer.installer");
Object.defineProperty(exports, "customerInstaller", { enumerable: true, get: function () { return customer_installer_1.customerInstaller; } });
var location_installer_1 = require("./location.installer");
Object.defineProperty(exports, "locationInstaller", { enumerable: true, get: function () { return location_installer_1.locationInstaller; } });
var report_installer_1 = require("./report.installer");
Object.defineProperty(exports, "reportInstaller", { enumerable: true, get: function () { return report_installer_1.reportInstaller; } });
var import_installer_1 = require("./import.installer");
Object.defineProperty(exports, "importInstaller", { enumerable: true, get: function () { return import_installer_1.importInstaller; } });
var export_installer_1 = require("./export.installer");
Object.defineProperty(exports, "exportInstaller", { enumerable: true, get: function () { return export_installer_1.exportInstaller; } });
var dashboard_installer_1 = require("./dashboard.installer");
Object.defineProperty(exports, "dashboardInstaller", { enumerable: true, get: function () { return dashboard_installer_1.dashboardInstaller; } });
// All installers in recommended order
const auth_installer_2 = require("./auth.installer");
const material_installer_2 = require("./material.installer");
const stock_installer_2 = require("./stock.installer");
const order_installer_2 = require("./order.installer");
const cutting_job_installer_2 = require("./cutting-job.installer");
const optimization_installer_2 = require("./optimization.installer");
const production_installer_2 = require("./production.installer");
const machine_installer_2 = require("./machine.installer");
const customer_installer_2 = require("./customer.installer");
const location_installer_2 = require("./location.installer");
const report_installer_2 = require("./report.installer");
const import_installer_2 = require("./import.installer");
const export_installer_2 = require("./export.installer");
const dashboard_installer_2 = require("./dashboard.installer");
/**
 * All module installers in recommended installation order
 * Order matters: dependencies should be installed before dependents
 */
exports.allInstallers = [
    // Core modules (no dependencies on other modules)
    auth_installer_2.authInstaller,
    material_installer_2.materialInstaller,
    stock_installer_2.stockInstaller,
    order_installer_2.orderInstaller,
    machine_installer_2.machineInstaller,
    customer_installer_2.customerInstaller,
    location_installer_2.locationInstaller,
    // Dependent modules
    cutting_job_installer_2.cuttingJobInstaller, // depends on order
    optimization_installer_2.optimizationInstaller, // depends on cutting-job, stock
    production_installer_2.productionInstaller, // depends on optimization, stock
    // Utility modules
    report_installer_2.reportInstaller,
    import_installer_2.importInstaller,
    export_installer_2.exportInstaller,
    dashboard_installer_2.dashboardInstaller
];
//# sourceMappingURL=index.js.map