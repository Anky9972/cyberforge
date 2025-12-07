/**
 * Upload Optimizer Service
 * Handles large file uploads efficiently without blocking the UI
 */

interface UploadProgress {
    phase: string;
    progress: number;
    message: string;
}

type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Process large files in chunks to prevent UI blocking
 */
export class UploadOptimizer {
    private static readonly CHUNK_SIZE = 256 * 1024; // 256KB chunks - increased for large files
    private abortController: AbortController | null = null;

    /**
     * Read file in chunks using FileReader with yielding to prevent UI freeze
     */
    async readFileInChunks(file: File, onProgress: ProgressCallback): Promise<ArrayBuffer> {
        this.abortController = new AbortController();
        const chunks: Uint8Array[] = [];
        let offset = 0;
        
        while (offset < file.size) {
            if (this.abortController.signal.aborted) {
                throw new Error('Upload cancelled');
            }

            const chunk = file.slice(offset, offset + UploadOptimizer.CHUNK_SIZE);
            const arrayBuffer = await chunk.arrayBuffer();
            chunks.push(new Uint8Array(arrayBuffer));
            
            offset += UploadOptimizer.CHUNK_SIZE;
            const progress = Math.min((offset / file.size) * 100, 100);
            
            onProgress({
                phase: 'Reading file',
                progress,
                message: `Processing ${(offset / 1024).toFixed(0)}KB of ${(file.size / 1024).toFixed(0)}KB`
            });

            // Yield to UI thread every chunk
            await this.yieldToMain();
        }

        // Combine chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let position = 0;
        
        for (const chunk of chunks) {
            result.set(chunk, position);
            position += chunk.length;
        }

        return result.buffer;
    }

    /**
     * Yield control back to the main thread to prevent blocking
     */
    private async yieldToMain(): Promise<void> {
        return new Promise(resolve => {
            // Use scheduler API if available (Chrome 94+)
            if ('scheduler' in window && 'yield' in (window as any).scheduler) {
                (window as any).scheduler.yield().then(resolve);
            } else {
                // Fallback to setTimeout
                setTimeout(resolve, 0);
            }
        });
    }

    /**
     * Cancel ongoing upload
     */
    cancel(): void {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    /**
     * Debounce function for reducing rapid updates
     */
    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    /**
     * Throttle function for limiting update frequency
     */
    static throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }

    /**
     * Batch multiple async operations with concurrency limit
     */
    static async batchProcess<T, R>(
        items: T[],
        processor: (item: T, index: number) => Promise<R>,
        options: {
            concurrency?: number;
            onProgress?: (completed: number, total: number) => void;
        } = {}
    ): Promise<R[]> {
        const { concurrency = 3, onProgress } = options;
        const results: R[] = [];
        let completed = 0;

        // Process in batches
        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const batchResults = await Promise.all(
                batch.map((item, idx) => processor(item, i + idx))
            );
            
            results.push(...batchResults);
            completed += batch.length;
            
            if (onProgress) {
                onProgress(completed, items.length);
            }
        }

        return results;
    }

    /**
     * Check if browser supports optimal performance features
     */
    static getPerformanceCapabilities(): {
        hasSchedulerAPI: boolean;
        hasWebWorkers: boolean;
        hasOffscreenCanvas: boolean;
        recommendedChunkSize: number;
    } {
        return {
            hasSchedulerAPI: 'scheduler' in window && 'yield' in (window as any).scheduler,
            hasWebWorkers: typeof Worker !== 'undefined',
            hasOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
            recommendedChunkSize: this.getRecommendedChunkSize(),
        };
    }

    /**
     * Calculate optimal chunk size based on available memory
     */
    private static getRecommendedChunkSize(): number {
        // Try to get device memory (Chrome only)
        const deviceMemory = (navigator as any).deviceMemory;
        
        if (deviceMemory) {
            // More memory = larger chunks for better performance
            if (deviceMemory >= 16) return 512 * 1024; // 512KB for high-end devices
            if (deviceMemory >= 8) return 384 * 1024; // 384KB
            if (deviceMemory >= 4) return 256 * 1024; // 256KB
            return 128 * 1024; // 128KB
        }
        
        // Default optimized chunk size
        return 256 * 1024;
    }

    /**
     * Estimate processing time based on file size
     */
    static estimateProcessingTime(fileSizeBytes: number): {
        estimatedSeconds: number;
        confidence: 'low' | 'medium' | 'high';
    } {
        // Based on typical processing speeds
        const MB = fileSizeBytes / (1024 * 1024);
        
        // Optimized processing time estimates (seconds per MB)
        const parseTimePerMB = 0.3; // Faster with new optimizations
        const analysisTimePerMB = 1.5; // More efficient batching
        
        const totalTime = (MB * parseTimePerMB) + (MB * analysisTimePerMB);
        
        return {
            estimatedSeconds: Math.ceil(totalTime),
            confidence: MB < 10 ? 'high' : MB < 25 ? 'medium' : 'low'
        };
    }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
    private static checkMemory(): number | null {
        if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        }
        return null;
    }

    /**
     * Check if we're approaching memory limits
     */
    static isMemoryPressure(): boolean {
        const usage = this.checkMemory();
        if (usage === null) return false;
        
        // Alert if using more than 80% of heap
        return usage > 0.8;
    }

    /**
     * Get memory usage info for debugging
     */
    static getMemoryInfo(): string {
        if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
            const total = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1);
            return `${used}MB / ${total}MB (${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(0)}%)`;
        }
        return 'Memory info not available';
    }

    /**
     * Force garbage collection if available (dev/debug only)
     */
    static forceGC(): void {
        if ((window as any).gc) {
            console.log('🗑️ Forcing garbage collection...');
            (window as any).gc();
        }
    }
}
