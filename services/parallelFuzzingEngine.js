/**
 * Parallel Fuzzing Engine with Worker Threads
 * Implements concurrent fuzzing to improve throughput 4-10x
 */
import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import os from 'os';
class ParallelFuzzingEngine extends EventEmitter {
    workers;
    taskQueue;
    activeTasks;
    concurrency;
    workerScript;
    completedTasks = 0;
    failedTasks = 0;
    constructor(concurrency) {
        super();
        this.concurrency = concurrency || Math.max(1, os.cpus().length - 1);
        this.workers = new Map();
        this.taskQueue = [];
        this.activeTasks = new Map();
        this.workerScript = './fuzzWorker.js';
    }
    /**
     * Initialize worker pool
     */
    async initialize() {
        console.log(`🚀 Initializing ${this.concurrency} fuzzing workers...`);
        for (let i = 0; i < this.concurrency; i++) {
            await this.createWorker(i);
        }
        console.log(`✅ Worker pool ready with ${this.concurrency} workers`);
    }
    /**
     * Create a worker thread
     */
    async createWorker(workerId) {
        try {
            const worker = new Worker('./services/workers/fuzzWorker.js', {
                workerData: { workerId }
            });
            worker.on('message', (message) => {
                this.handleWorkerMessage(workerId, message);
            });
            worker.on('error', (error) => {
                this.handleWorkerError(workerId, error);
            });
            worker.on('exit', (code) => {
                this.handleWorkerExit(workerId, code);
            });
            this.workers.set(workerId, worker);
        }
        catch (error) {
            console.error(`Failed to create worker ${workerId}:`, error);
            throw error;
        }
    }
    /**
     * Handle worker messages
     */
    handleWorkerMessage(workerId, message) {
        const task = this.activeTasks.get(workerId);
        if (!task)
            return;
        switch (message.type) {
            case 'progress':
                this.emit('progress', {
                    workerId,
                    targetId: task.target.id,
                    ...message.data
                });
                break;
            case 'result':
                task.status = 'completed';
                task.result = message.data;
                this.completedTasks++;
                this.emit('taskCompleted', {
                    workerId,
                    task
                });
                this.activeTasks.delete(workerId);
                this.assignNextTask(workerId);
                break;
            case 'error':
                task.status = 'failed';
                task.error = new Error(message.error);
                this.failedTasks++;
                this.emit('taskFailed', {
                    workerId,
                    task
                });
                this.activeTasks.delete(workerId);
                this.assignNextTask(workerId);
                break;
        }
    }
    /**
     * Handle worker errors
     */
    handleWorkerError(workerId, error) {
        console.error(`Worker ${workerId} error:`, error);
        const task = this.activeTasks.get(workerId);
        if (task) {
            task.status = 'failed';
            task.error = error;
            this.failedTasks++;
            this.emit('taskFailed', { workerId, task });
        }
        this.activeTasks.delete(workerId);
        // Recreate worker
        this.createWorker(workerId).then(() => {
            this.assignNextTask(workerId);
        });
    }
    /**
     * Handle worker exit
     */
    handleWorkerExit(workerId, code) {
        if (code !== 0) {
            console.error(`Worker ${workerId} exited with code ${code}`);
        }
        this.workers.delete(workerId);
    }
    /**
     * Add fuzzing targets to queue
     */
    addTargets(targets) {
        for (const target of targets) {
            this.taskQueue.push({
                id: target.id,
                target,
                status: 'pending'
            });
        }
        this.emit('targetsAdded', targets.length);
    }
    /**
     * Start parallel fuzzing
     */
    async start() {
        if (this.workers.size === 0) {
            await this.initialize();
        }
        // Assign initial tasks to workers
        for (const [workerId] of this.workers) {
            this.assignNextTask(workerId);
        }
        // Wait for all tasks to complete
        return new Promise((resolve) => {
            const checkCompletion = () => {
                if (this.taskQueue.length === 0 && this.activeTasks.size === 0) {
                    const results = [];
                    // Collect results (implementation depends on how you store completed tasks)
                    this.emit('allCompleted', {
                        completed: this.completedTasks,
                        failed: this.failedTasks
                    });
                    resolve(results);
                }
            };
            this.on('taskCompleted', checkCompletion);
            this.on('taskFailed', checkCompletion);
        });
    }
    /**
     * Assign next task to worker
     */
    assignNextTask(workerId) {
        if (this.taskQueue.length === 0)
            return;
        const worker = this.workers.get(workerId);
        if (!worker)
            return;
        const task = this.taskQueue.shift();
        if (!task)
            return;
        task.status = 'running';
        this.activeTasks.set(workerId, task);
        worker.postMessage({
            type: 'fuzz',
            data: task.target
        });
        this.emit('taskStarted', {
            workerId,
            targetId: task.target.id
        });
    }
    /**
     * Get current statistics
     */
    getStats() {
        return {
            totalWorkers: this.workers.size,
            activeWorkers: this.activeTasks.size,
            queuedTasks: this.taskQueue.length,
            completedTasks: this.completedTasks,
            failedTasks: this.failedTasks
        };
    }
    /**
     * Pause fuzzing
     */
    pause() {
        for (const worker of this.workers.values()) {
            worker.postMessage({ type: 'pause' });
        }
        this.emit('paused');
    }
    /**
     * Resume fuzzing
     */
    resume() {
        for (const worker of this.workers.values()) {
            worker.postMessage({ type: 'resume' });
        }
        this.emit('resumed');
    }
    /**
     * Stop all workers
     */
    async shutdown() {
        console.log('🛑 Shutting down worker pool...');
        const terminationPromises = [];
        for (const worker of this.workers.values()) {
            terminationPromises.push(worker.terminate());
        }
        await Promise.all(terminationPromises);
        this.workers.clear();
        this.activeTasks.clear();
        this.taskQueue = [];
        console.log('✅ Worker pool shut down');
    }
}
// Helper function to chunk array for parallel processing
export function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}
export const parallelFuzzingEngine = new ParallelFuzzingEngine();
export default ParallelFuzzingEngine;
//# sourceMappingURL=parallelFuzzingEngine.js.map