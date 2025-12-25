/**
 * Job Queue Interfaces and Types
 * Following SOLID principles for background job processing
 */
/**
 * Base job data interface
 */
export interface IJobData {
    [key: string]: unknown;
}
/**
 * Job options for scheduling and retry
 */
export interface IJobOptions {
    /** Delay before processing (ms) */
    delay?: number;
    /** Number of retry attempts */
    attempts?: number;
    /** Backoff strategy */
    backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
    };
    /** Job priority (1 = highest) */
    priority?: number;
    /** Remove job after completion */
    removeOnComplete?: boolean | number;
    /** Remove job after failure */
    removeOnFail?: boolean | number;
    /** Unique job ID */
    jobId?: string;
    /** Cron expression for recurring jobs */
    repeat?: {
        pattern: string;
        limit?: number;
    };
}
/**
 * Job status tracking
 */
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';
/**
 * Job result wrapper
 */
export interface IJobResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    duration?: number;
}
/**
 * Job progress update
 */
export interface IJobProgress {
    percent: number;
    message?: string;
}
/**
 * Queue interface for adding jobs
 */
export interface IJobQueue<TData extends IJobData = IJobData> {
    /** Queue name */
    readonly name: string;
    /** Add a job to the queue */
    add(name: string, data: TData, options?: IJobOptions): Promise<string>;
    /** Add multiple jobs */
    addBulk(jobs: Array<{
        name: string;
        data: TData;
        options?: IJobOptions;
    }>): Promise<string[]>;
    /** Get job by ID */
    getJob(jobId: string): Promise<IJobInfo | null>;
    /** Get queue statistics */
    getStats(): Promise<IQueueStats>;
    /** Pause the queue */
    pause(): Promise<void>;
    /** Resume the queue */
    resume(): Promise<void>;
    /** Clean old jobs */
    clean(grace: number, limit: number, status: JobStatus): Promise<string[]>;
}
/**
 * Job processor interface
 */
export interface IJobProcessor<TData extends IJobData = IJobData, TResult = unknown> {
    /** Process a job */
    process(data: TData, jobId: string): Promise<IJobResult<TResult>>;
}
/**
 * Job information
 */
export interface IJobInfo {
    id: string;
    name: string;
    data: IJobData;
    status: JobStatus;
    progress: number;
    attemptsMade: number;
    processedOn?: Date;
    finishedOn?: Date;
    failedReason?: string;
}
/**
 * Queue statistics
 */
export interface IQueueStats {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
}
/**
 * Email job data
 */
export interface IEmailJobData extends IJobData {
    to: string | string[];
    subject: string;
    template: string;
    context: Record<string, unknown>;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}
/**
 * Report generation job data
 */
export interface IReportJobData extends IJobData {
    reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
    tenantId: string;
    userId: string;
    parameters: Record<string, unknown>;
    format: 'pdf' | 'excel' | 'csv';
}
/**
 * Cleanup job data
 */
export interface ICleanupJobData extends IJobData {
    targetType: 'audit_logs' | 'temp_files' | 'expired_sessions' | 'old_reports';
    olderThanDays: number;
    dryRun?: boolean;
}
/**
 * Optimization job data
 */
export interface IOptimizationJobData extends IJobData {
    cuttingJobId: string;
    scenarioId: string;
    tenantId: string;
    userId: string;
    parameters: Record<string, unknown>;
}
//# sourceMappingURL=interfaces.d.ts.map