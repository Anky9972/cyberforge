/**
 * Parallel Fuzzing Engine with Worker Threads
 * Implements concurrent fuzzing to improve throughput 4-10x
 */
import { EventEmitter } from 'events';
interface FuzzTarget {
    id: string;
    code: string;
    language: string;
    seeds: string[];
    options?: {
        timeout?: number;
        maxIterations?: number;
        coverage?: boolean;
    };
}
interface FuzzResult {
    targetId: string;
    crashes: any[];
    coverage: number[];
    executionCount: number;
    duration: number;
    newSeeds: string[];
    errors: string[];
}
declare class ParallelFuzzingEngine extends EventEmitter {
    private workers;
    private taskQueue;
    private activeTasks;
    private concurrency;
    private workerScript;
    private completedTasks;
    private failedTasks;
    constructor(concurrency?: number);
    /**
     * Initialize worker pool
     */
    initialize(): Promise<void>;
    /**
     * Create a worker thread
     */
    private createWorker;
    /**
     * Handle worker messages
     */
    private handleWorkerMessage;
    /**
     * Handle worker errors
     */
    private handleWorkerError;
    /**
     * Handle worker exit
     */
    private handleWorkerExit;
    /**
     * Add fuzzing targets to queue
     */
    addTargets(targets: FuzzTarget[]): void;
    /**
     * Start parallel fuzzing
     */
    start(): Promise<FuzzResult[]>;
    /**
     * Assign next task to worker
     */
    private assignNextTask;
    /**
     * Get current statistics
     */
    getStats(): {
        totalWorkers: number;
        activeWorkers: number;
        queuedTasks: number;
        completedTasks: number;
        failedTasks: number;
    };
    /**
     * Pause fuzzing
     */
    pause(): void;
    /**
     * Resume fuzzing
     */
    resume(): void;
    /**
     * Stop all workers
     */
    shutdown(): Promise<void>;
}
export declare function chunkArray<T>(array: T[], chunkSize: number): T[][];
export declare const parallelFuzzingEngine: ParallelFuzzingEngine;
export default ParallelFuzzingEngine;
//# sourceMappingURL=parallelFuzzingEngine.d.ts.map