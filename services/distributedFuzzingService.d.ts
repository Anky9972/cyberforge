/**
 * Distributed Fuzzing Service with Bull Queue
 * Implements job queue for distributed fuzzing across multiple worker nodes
 */
import { Job, QueueOptions } from 'bull';
import { EventEmitter } from 'events';
interface FuzzJob {
    targetId: string;
    code: string;
    language: string;
    seeds: string[];
    options?: {
        timeout?: number;
        maxIterations?: number;
        priority?: number;
    };
}
interface FuzzJobResult {
    targetId: string;
    crashes: any[];
    coverage: number[];
    executionCount: number;
    duration: number;
    newSeeds: string[];
    workerId: string;
}
declare class DistributedFuzzingService extends EventEmitter {
    private fuzzQueue;
    private resultQueue;
    private isInitialized;
    private readonly QUEUE_NAME;
    private readonly RESULT_QUEUE_NAME;
    /**
     * Initialize Bull queues
     */
    initialize(redisConfig?: QueueOptions): Promise<void>;
    /**
     * Setup queue event handlers
     */
    private setupQueueEventHandlers;
    /**
     * Add fuzzing job to queue
     */
    addFuzzJob(job: FuzzJob): Promise<string>;
    /**
     * Add multiple fuzzing jobs
     */
    addBulkFuzzJobs(jobs: FuzzJob[]): Promise<string[]>;
    /**
     * Process fuzzing jobs (worker node)
     */
    startWorker(concurrency?: number, processFunction?: (job: Job<FuzzJob>) => Promise<FuzzJobResult>): Promise<void>;
    /**
     * Default fuzzing processor
     */
    private defaultFuzzProcessor;
    /**
     * Simulate fuzz execution (placeholder)
     */
    private simulateFuzzExecution;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<{
        state: string;
        progress: number;
        result?: any;
        error?: any;
    }>;
    /**
     * Get queue statistics
     */
    getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
    /**
     * Pause queue
     */
    pauseQueue(): Promise<void>;
    /**
     * Resume queue
     */
    resumeQueue(): Promise<void>;
    /**
     * Clear completed jobs
     */
    clearCompleted(): Promise<void>;
    /**
     * Retry failed jobs
     */
    retryFailedJobs(): Promise<number>;
    /**
     * Shutdown service
     */
    shutdown(): Promise<void>;
}
export declare const distributedFuzzingService: DistributedFuzzingService;
export default DistributedFuzzingService;
//# sourceMappingURL=distributedFuzzingService.d.ts.map