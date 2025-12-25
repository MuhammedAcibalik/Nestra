/**
 * Installers Module - Barrel Export
 * Provides all module installers for composition root decomposition
 */

export * from './installer.interface';

// Module installers
export { authInstaller } from './auth.installer';
export { materialInstaller } from './material.installer';
export { stockInstaller } from './stock.installer';
export { orderInstaller } from './order.installer';
export { optimizationInstaller } from './optimization.installer';
export { productionInstaller } from './production.installer';
export { cuttingJobInstaller } from './cutting-job.installer';
export { machineInstaller } from './machine.installer';
export { customerInstaller } from './customer.installer';
export { locationInstaller } from './location.installer';
export { reportInstaller } from './report.installer';
export { importInstaller } from './import.installer';
export { exportInstaller } from './export.installer';
export { dashboardInstaller } from './dashboard.installer';

// All installers in recommended order
import { authInstaller } from './auth.installer';
import { materialInstaller } from './material.installer';
import { stockInstaller } from './stock.installer';
import { orderInstaller } from './order.installer';
import { cuttingJobInstaller } from './cutting-job.installer';
import { optimizationInstaller } from './optimization.installer';
import { productionInstaller } from './production.installer';
import { machineInstaller } from './machine.installer';
import { customerInstaller } from './customer.installer';
import { locationInstaller } from './location.installer';
import { reportInstaller } from './report.installer';
import { importInstaller } from './import.installer';
import { exportInstaller } from './export.installer';
import { dashboardInstaller } from './dashboard.installer';
import { IModuleInstaller } from './installer.interface';

/**
 * All module installers in recommended installation order
 * Order matters: dependencies should be installed before dependents
 */
export const allInstallers: readonly IModuleInstaller[] = [
    // Core modules (no dependencies on other modules)
    authInstaller,
    materialInstaller,
    stockInstaller,
    orderInstaller,
    machineInstaller,
    customerInstaller,
    locationInstaller,

    // Dependent modules
    cuttingJobInstaller, // depends on order
    optimizationInstaller, // depends on cutting-job, stock
    productionInstaller, // depends on optimization, stock

    // Utility modules
    reportInstaller,
    importInstaller,
    exportInstaller,
    dashboardInstaller
];
