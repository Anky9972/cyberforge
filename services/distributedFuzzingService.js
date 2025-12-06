/**
 * Distributed Fuzzing Service with Bull Queue
 * Implements job queue for distributed fuzzing across multiple worker nodes
 */
import Bull from 'bull';
import { EventEmitter } from 'events';
class DistributedFuzzingService extends EventEmitter {
    fuzzQueue = null;
    resultQueue = null;
    isInitialized = false;
    QUEUE_NAME = 'fuzzing-tasks';
    RESULT_QUEUE_NAME = 'fuzzing-results';
    /**
     * Initialize Bull queues
     */
    async initialize(redisConfig) {
        if (this.isInitialized)
            return;
        const config = redisConfig || {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                },
                removeOnComplete: 100, // Keep last 100 completed jobs
                removeOnFail: false
            }
        };
        try {
            this.fuzzQueue = new Bull(this.QUEUE_NAME, config);
            this.resultQueue = new Bull(this.RESULT_QUEUE_NAME, config);
            // Queue event handlers
            this.setupQueueEventHandlers();
            this.isInitialized = true;
            console.log('✅ Distributed Fuzzing Service initialized');
        }
        catch (error) {
            console.error('Failed to initialize fuzzing queues:', error);
            throw error;
        }
    }
    /**
     * Setup queue event handlers
     */
    setupQueueEventHandlers() {
        if (!this.fuzzQueue)
            return;
        this.fuzzQueue.on('completed', (job, result) => {
            console.log(`✅ Job ${job.id} completed`);
            this.emit('jobCompleted', { jobId: job.id, result });
        });
        this.fuzzQueue.on('failed', (job, err) => {
            console.error(`❌ Job ${job?.id} failed:`, err.message);
            this.emit('jobFailed', { jobId: job?.id, error: err });
        });
        this.fuzzQueue.on('progress', (job, progress) => {
            this.emit('jobProgress', { jobId: job.id, progress });
        });
        this.fuzzQueue.on('stalled', (job) => {
            console.warn(`⚠️  Job ${job.id} stalled`);
            this.emit('jobStalled', { jobId: job.id });
        });
        this.fuzzQueue.on('error', (error) => {
            console.error('Queue error:', error);
            this.emit('error', error);
        });
    }
    /**
     * Add fuzzing job to queue
     */
    async addFuzzJob(job) {
        if (!this.fuzzQueue) {
            throw new Error('Fuzzing queue not initialized');
        }
        const bullJob = await this.fuzzQueue.add('fuzz', job, {
            priority: job.options?.priority || 5,
            timeout: job.options?.timeout || 60000,
            jobId: job.targetId
        });
        console.log(`📥 Added fuzzing job: ${bullJob.id}`);
        return bullJob.id?.toString() || '';
    }
    /**
     * Add multiple fuzzing jobs
     */
    async addBulkFuzzJobs(jobs) {
        if (!this.fuzzQueue) {
            throw new Error('Fuzzing queue not initialized');
        }
        const bullJobs = jobs.map(job => ({
            name: 'fuzz',
            data: job,
            opts: {
                priority: job.options?.priority || 5,
                timeout: job.options?.timeout || 60000,
                jobId: job.targetId
            }
        }));
        const addedJobs = await this.fuzzQueue.addBulk(bullJobs);
        const jobIds = addedJobs.map(j => j.id?.toString() || '');
        console.log(`📥 Added ${jobIds.length} fuzzing jobs in bulk`);
        return jobIds;
    }
    /**
     * Process fuzzing jobs (worker node)
     */
    async startWorker(concurrency = 5, processFunction) {
        if (!this.fuzzQueue) {
            throw new Error('Fuzzing queue not initialized');
        }
        const processor = processFunction || this.defaultFuzzProcessor.bind(this);
        this.fuzzQueue.process('fuzz', concurrency, async (job) => {
            console.log(`🔨 Processing job ${job.id} on worker...`);
            try {
                const result = await processor(job);
                // Store result in result queue
                if (this.resultQueue) {
                    await this.resultQueue.add('result', result);
                }
                return result;
            }
            catch (error) {
                console.error(`Error processing job ${job.id}:`, error);
                throw error;
            }
        });
        console.log(`🔨 Worker started with concurrency: ${concurrency}`);
    }
    /**
     * Default fuzzing processor
     */
    async defaultFuzzProcessor(job) {
        const { targetId, code, language, seeds, options } = job.data;
        const startTime = Date.now();
        const crashes = [];
        const coverage = [];
        const newSeeds = [];
        let executionCount = 0;
        const maxIterations = options?.maxIterations || 1000;
        // Report progress
        await job.progress(0);
        for (let i = 0; i < maxIterations; i++) {
            const seed = seeds[i % seeds.length];
            // Simulate fuzzing execution
            // In production, use real VM executor
            const result = await this.simulateFuzzExecution(code, seed);
            executionCount++;
            if (result.crashed) {
                crashes.push(result);
            }
            if (result.newCoverage) {
                coverage.push(...result.newCoverage);
                if (result.newCoverage.length > 0) {
                    newSeeds.push(seed);
                }
            }
            // Report progress every 100 iterations
            if (i % 100 === 0) {
                await job.progress(Math.floor((i / maxIterations) * 100));
            }
        }
        await job.progress(100);
        return {
            targetId,
            crashes,
            coverage,
            executionCount,
            duration: Date.now() - startTime,
            newSeeds,
            workerId: process.pid.toString()
        };
    }
    /**
     * Simulate fuzz execution (placeholder)
     */
    async simulateFuzzExecution(code, input) {
        // This is a placeholder - in production, use real VM executor
        await new Promise(resolve => setTimeout(resolve, 1));
        const crashed = Math.random() < 0.01; // 1% crash rate
        const newCoverage = Math.random() < 0.1 ? [Math.floor(Math.random() * 100)] : [];
        return {
            crashed,
            error: crashed ? 'Simulated crash' : undefined,
            newCoverage
        };
    }
    /**
     * Get job status
     */
    async getJobStatus(jobId) {
        if (!this.fuzzQueue) {
            throw new Error('Fuzzing queue not initialized');
        }
        const job = await this.fuzzQueue.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }
        const state = await job.getState();
        const progress = job.progress();
        return {
            state,
            progress: typeof progress === 'number' ? progress : 0,
            result: job.returnvalue,
            error: job.failedReason
        };
    }
    /**
     * Get queue statistics
     */
    async getQueueStats() {
        if (!this.fuzzQueue) {
            throw new Error('Fuzzing queue not initialized');
        }
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.fuzzQueue.getWaitingCount(),
            this.fuzzQueue.getActiveCount(),
            this.fuzzQueue.getCompletedCount(),
            this.fuzzQueue.getFailedCount(),
            this.fuzzQueue.getDelayedCount()
        ]);
        return {
            waiting,
            active,
            completed,
            failed,
            delayed
        };
    }
    /**
     * Pause queue
     */
    async pauseQueue() {
        if (!this.fuzzQueue)
            return;
        await this.fuzzQueue.pause();
        console.log('⏸️  Queue paused');
    }
    /**
     * Resume queue
     */
    async resumeQueue() {
        if (!this.fuzzQueue)
            return;
        await this.fuzzQueue.resume();
        console.log('▶️  Queue resumed');
    }
    /**
     * Clear completed jobs
     */
    async clearCompleted() {
        if (!this.fuzzQueue)
            return;
        await this.fuzzQueue.clean(0, 'completed');
        console.log('🧹 Cleared completed jobs');
    }
    /**
     * Retry failed jobs
     */
    async retryFailedJobs() {
        if (!this.fuzzQueue)
            return 0;
        const failedJobs = await this.fuzzQueue.getFailed();
        let retriedCount = 0;
        for (const job of failedJobs) {
            try {
                await job.retry();
                retriedCount++;
            }
            catch (error) {
                console.error(`Failed to retry job ${job.id}:`, error);
            }
        }
        console.log(`🔄 Retried ${retriedCount} failed jobs`);
        return retriedCount;
    }
    /**
     * Shutdown service
     */
    async shutdown() {
        if (this.fuzzQueue) {
            await this.fuzzQueue.close();
        }
        if (this.resultQueue) {
            await this.resultQueue.close();
        }
        this.isInitialized = false;
        console.log('✅ Distributed Fuzzing Service shut down');
    }
}
export const distributedFuzzingService = new DistributedFuzzingService();
export default DistributedFuzzingService;
//# sourceMappingURL=distributedFuzzingService.js.map