/**
 * Job Queue Service
 * Redis-backed queue for scan jobs with priority and retry logic
 */

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface Job {
  id: string;
  type: 'scan' | 'analysis' | 'report';
  priority: number; // 1-10, higher = more urgent
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

export interface JobQueueConfig {
  redisUrl?: string;
  maxConcurrent?: number;
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

export class JobQueue {
  private redis: Redis;
  private processingJobs: Map<string, Job> = new Map();
  private workers: number = 0;
  private maxConcurrent: number;
  private retryAttempts: number;
  private retryDelay: number;
  private isRunning: boolean = false;

  constructor(config: JobQueueConfig = {}) {
    this.redis = new Redis(config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.maxConcurrent = config.maxConcurrent || parseInt(process.env.MAX_CONCURRENT_SCANS || '5');
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 5000;

    console.log(`✅ Job Queue initialized (max concurrent: ${this.maxConcurrent})`);
  }

  /**
   * Add job to queue
   */
  async enqueue(type: Job['type'], data: any, priority: number = 5): Promise<string> {
    const job: Job = {
      id: uuidv4(),
      type,
      priority,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.retryAttempts,
      createdAt: new Date(),
    };

    // Store job data
    await this.redis.set(`job:${job.id}`, JSON.stringify(job));

    // Add to priority queue
    await this.redis.zadd('job:queue', priority, job.id);

    console.log(`📋 Job enqueued: ${job.id} (type: ${type}, priority: ${priority})`);

    return job.id;
  }

  /**
   * Get next job from queue (highest priority)
   */
  private async dequeue(): Promise<Job | null> {
    // Get highest priority job
    const result = await this.redis.zpopmax('job:queue');
    
    if (!result || result.length === 0) {
      return null;
    }

    const jobId = result[0];
    const jobData = await this.redis.get(`job:${jobId}`);
    
    if (!jobData) {
      return null;
    }

    return JSON.parse(jobData) as Job;
  }

  /**
   * Update job status
   */
  private async updateJob(job: Job): Promise<void> {
    await this.redis.set(`job:${job.id}`, JSON.stringify(job));
  }

  /**
   * Start processing jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ Job queue already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Job queue started');

    // Start worker loop
    this.processJobs();
  }

  /**
   * Stop processing jobs
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Wait for active jobs to complete
    while (this.processingJobs.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('⏸️ Job queue stopped');
  }

  /**
   * Main job processing loop
   */
  private async processJobs(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if we can process more jobs
        if (this.workers >= this.maxConcurrent) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // Get next job
        const job = await this.dequeue();
        
        if (!job) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        // Process job in background
        this.processJob(job).catch(error => {
          console.error(`Failed to process job ${job.id}:`, error);
        });

      } catch (error) {
        console.error('Job queue error:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    this.workers++;
    this.processingJobs.set(job.id, job);

    try {
      job.status = 'processing';
      job.startedAt = new Date();
      job.attempts++;
      await this.updateJob(job);

      console.log(`⚙️ Processing job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);

      // Execute job based on type
      const result = await this.executeJob(job);

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      await this.updateJob(job);

      // Publish completion event
      await this.redis.publish('job:completed', JSON.stringify({ jobId: job.id, result }));

      console.log(`✅ Job completed: ${job.id}`);

    } catch (error: any) {
      console.error(`❌ Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, error.message);

      job.error = error.message;

      // Retry if attempts remaining
      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        await this.updateJob(job);

        // Re-queue with delay
        setTimeout(async () => {
          await this.redis.zadd('job:queue', job.priority, job.id);
          console.log(`🔄 Job ${job.id} re-queued for retry`);
        }, this.retryDelay);

      } else {
        job.status = 'failed';
        job.completedAt = new Date();
        await this.updateJob(job);

        // Publish failure event
        await this.redis.publish('job:failed', JSON.stringify({ jobId: job.id, error: error.message }));
      }

    } finally {
      this.processingJobs.delete(job.id);
      this.workers--;
    }
  }

  /**
   * Execute job based on type
   */
  private async executeJob(job: Job): Promise<any> {
    switch (job.type) {
      case 'scan':
        return await this.executeScanJob(job.data);
      
      case 'analysis':
        return await this.executeAnalysisJob(job.data);
      
      case 'report':
        return await this.executeReportJob(job.data);
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Execute scan job
   */
  private async executeScanJob(data: any): Promise<any> {
    // This will be implemented by the scan service
    // For now, just simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { status: 'success', scanId: data.scanId };
  }

  /**
   * Execute analysis job
   */
  private async executeAnalysisJob(data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { status: 'success', analysisId: data.analysisId };
  }

  /**
   * Execute report generation job
   */
  private async executeReportJob(data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { status: 'success', reportId: data.reportId };
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<Job | null> {
    const jobData = await this.redis.get(`job:${jobId}`);
    return jobData ? JSON.parse(jobData) : null;
  }

  /**
   * Get queue stats
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    workers: number;
    maxConcurrent: number;
  }> {
    const pending = await this.redis.zcard('job:queue');

    return {
      pending,
      processing: this.processingJobs.size,
      workers: this.workers,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    // Remove from queue
    await this.redis.zrem('job:queue', jobId);

    // Update status if job exists
    const job = await this.getJob(jobId);
    if (job && job.status === 'pending') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.completedAt = new Date();
      await this.updateJob(job);
      return true;
    }

    return false;
  }

  /**
   * Clear completed/failed jobs older than specified time
   */
  async cleanupOldJobs(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const keys = await this.redis.keys('job:*');
    let deleted = 0;

    for (const key of keys) {
      if (!key.startsWith('job:queue')) {
        const jobData = await this.redis.get(key);
        if (jobData) {
          const job = JSON.parse(jobData) as Job;
          if (job.completedAt) {
            const age = Date.now() - new Date(job.completedAt).getTime();
            if (age > olderThanMs) {
              await this.redis.del(key);
              deleted++;
            }
          }
        }
      }
    }

    console.log(`🧹 Cleaned up ${deleted} old jobs`);
    return deleted;
  }

  /**
   * Subscribe to job events
   */
  async subscribe(
    event: 'completed' | 'failed',
    callback: (data: any) => void
  ): Promise<void> {
    const subscriber = this.redis.duplicate();
    await subscriber.subscribe(`job:${event}`);
    
    subscriber.on('message', (channel, message) => {
      callback(JSON.parse(message));
    });
  }
}

// Singleton instance
export const jobQueue = new JobQueue();
