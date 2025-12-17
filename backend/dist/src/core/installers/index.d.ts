/**
 * Installers Module - Barrel Export
 * Provides all module installers for composition root decomposition
 */
export * from './installer.interface';
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
import { IModuleInstaller } from './installer.interface';
/**
 * All module installers in recommended installation order
 * Order matters: dependencies should be installed before dependents
 */
export declare const allInstallers: readonly IModuleInstaller[];
//# sourceMappingURL=index.d.ts.map