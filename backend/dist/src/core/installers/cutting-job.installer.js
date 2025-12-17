"use strict";
/**
 * Cutting Job Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuttingJobInstaller = void 0;
const cutting_job_1 = require("../../modules/cutting-job");
const cutting_job_service_handler_1 = require("../../modules/cutting-job/cutting-job.service-handler");
const cutting_job_event_handler_1 = require("../../modules/cutting-job/cutting-job.event-handler");
exports.cuttingJobInstaller = {
    name: 'cutting-job',
    install(context) {
        const { db, registry, authMiddleware } = context;
        const repository = new cutting_job_1.CuttingJobRepository(db);
        const serviceHandler = new cutting_job_service_handler_1.CuttingJobServiceHandler(repository);
        registry.register('cutting-job', serviceHandler);
        const eventHandler = new cutting_job_event_handler_1.CuttingJobEventHandler(repository);
        eventHandler.register();
        const service = new cutting_job_1.CuttingJobService(repository);
        const controller = new cutting_job_1.CuttingJobController(service);
        return {
            router: controller.router,
            path: '/api/cutting-jobs',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=cutting-job.installer.js.map