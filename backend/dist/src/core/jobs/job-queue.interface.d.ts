/**
 * Job Queue Interface
 * Following Interface Segregation Principle (ISP)
 * Abstracts job queue implementation for easy swapping
 */
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
export interface IJobData {
    [key: string]: unknown;
}
export interface IJobOptions {
    /** Delay in milliseconds before processing */
    delay?: number;
    /** Number of retry attempts on failure */
    attempts?: number;
    /** Backoff strategy for retries */
    backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
    };
    /** Job priority (lower = higher priority) */
    priority?: number;
    /** Remove job after completion */
    removeOnComplete?: boolean | number;
    /** Remove job after failure */
    removeOnFail?: boolean | number;
    /** Unique job ID (prevents duplicates) */
    jobId?: string;
}
export interface IJob<T = IJobData> {
    id: string;
    name: string;
    data: T;
    status: JobStatus;
    progress: number;
    attemptsMade: number;
    failedReason?: string;
    finishedOn?: Date;
    processedOn?: Date;
}
export interface IJobResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
/**
 * Job Queue Client Interface
 */
export interface IJobQueue<T = IJobData> {
    /** Queue name */
    readonly name: string;
    /** Add a job to the queue */
    add(jobName: string, data: T, options?: IJobOptions): Promise<IJob<T>>;
    /** Add multiple jobs */
    addBulk(jobs: Array<{
        name: string;
        data: T;
        options?: IJobOptions;
    }>): Promise<IJob<T>[]>;
    /** Get job by ID */
    getJob(jobId: string): Promise<IJob<T> | null>;
    /** Get jobs by status */
    getJobs(status: JobStatus | JobStatus[], start?: number, end?: number): Promise<IJob<T>[]>;
    /** Remove a job */
    removeJob(jobId: string): Promise<void>;
    /** Pause the queue */
    pause(): Promise<void>;
    /** Resume the queue */
    resume(): Promise<void>;
    /** Clean old jobs */
    clean(grace: number, status: 'completed' | 'failed'): Promise<string[]>;
    /** Close the queue */
    close(): Promise<void>;
}
/**
 * Job Processor Interface
 */
export interface IJobProcessor<T = IJobData, R = unknown> {
    /** Process a job */
    process(job: IJob<T>): Promise<IJobResult<R>>;
    /** Called when job completes */
    onCompleted?(job: IJob<T>, result: IJobResult<R>): Promise<void>;
    /** Called when job fails */
    onFailed?(job: IJob<T>, error: Error): Promise<void>;
    /** Called on progress update */
    onProgress?(job: IJob<T>, progress: number): Promise<void>;
}
/**
 * Queue Manager Interface
 */
export interface IQueueManager {
    /** Create or get a queue */
    getQueue<T = IJobData>(name: string): IJobQueue<T>;
    /** Register a processor for a queue */
    registerProcessor<T = IJobData, R = unknown>(queueName: string, processor: IJobProcessor<T, R>): void;
    /** Get all queue names */
    getQueueNames(): string[];
    /** Shutdown all queues */
    shutdown(): Promise<void>;
}
/**
 * Job Types for Nestra
 */
export declare const JobType: {
    readonly OPTIMIZATION_RUN: "optimization:run";
    readonly OPTIMIZATION_BATCH: "optimization:batch";
    readonly REPORT_GENERATE: "report:generate";
    readonly EXPORT_PDF: "export:pdf";
    readonly EXPORT_EXCEL: "export:excel";
    readonly IMPORT_ORDERS: "import:orders";
    readonly IMPORT_STOCK: "import:stock";
    readonly NOTIFICATION_SEND: "notification:send";
    readonly CLEANUP_OLD_DATA: "cleanup:old-data";
};
export type JobTypeName = typeof JobType[keyof typeof JobType];
/**
 * Job Data Types
 */
export interface IOptimizationJobData extends IJobData {
    scenarioId: string;
    userId: string;
    priority?: 'low' | 'normal' | 'high';
}
export interface IReportJobData extends IJobData {
    reportType: 'waste' | 'efficiency' | 'customer' | 'machine';
    filters: Record<string, unknown>;
    userId: string;
    format: 'pdf' | 'excel';
}
export interface IExportJobData extends IJobData {
    planIds: string[];
    format: 'pdf' | 'excel';
    options: {
        includeLayouts?: boolean;
        includePieceDetails?: boolean;
        language?: 'tr' | 'en';
    };
    userId: string;
}
export interface IImportJobData extends IJobData {
    filePath: string;
    mapping: Record<string, string>;
    userId: string;
}
//# sourceMappingURL=job-queue.interface.d.ts.map