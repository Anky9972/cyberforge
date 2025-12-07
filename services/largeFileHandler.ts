/**
 * Advanced Large File Handler
 * Specialized optimizations for files > 10MB
 */

interface ChunkMetadata {
    index: number;
    size: number;
    processed: boolean;
    hash?: string;
}

export class LargeFileHandler {
    private static readonly LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
    private static readonly PROCESSING_BATCH_SIZE = 50; // Process 50 files at a time
    
    /**
     * Check if file needs special large file handling
     */
    static isLargeFile(size: number): boolean {
        return size > this.LARGE_FILE_THRESHOLD;
    }

    /**
     * Smart sampling: Analyze subset of large codebase for faster results
     */
    static smartSample(files: Map<string, any>, targetSize: number = 5 * 1024 * 1024): Map<string, any> {
        const sampledFiles = new Map<string, any>();
        let currentSize = 0;
        
        // Priority order for sampling
        const priorities = [
            /\/(api|routes|controllers|handlers)\//i,  // API/route files (high priority)
            /\/(auth|security|crypto)\//i,              // Security-related files
            /\/(models|entities|schemas)\//i,           // Data models
            /\.(ts|js|py|java)$/i,                     // Main source files
            /\/(tests?|spec)\//i,                      // Test files (lower priority)
        ];
        
        // First pass: High priority files
        for (const [path, content] of files) {
            if (currentSize >= targetSize) break;
            
            for (const pattern of priorities) {
                if (pattern.test(path)) {
                    sampledFiles.set(path, content);
                    currentSize += content.code?.length || 0;
                    break;
                }
            }
        }
        
        // Second pass: Fill remaining quota with any files
        if (currentSize < targetSize) {
            for (const [path, content] of files) {
                if (currentSize >= targetSize) break;
                if (!sampledFiles.has(path)) {
                    sampledFiles.set(path, content);
                    currentSize += content.code?.length || 0;
                }
            }
        }
        
        console.log(`📊 Smart sampling: Selected ${sampledFiles.size}/${files.size} files (${(currentSize/1024/1024).toFixed(1)}MB)`);
        return sampledFiles;
    }

    /**
     * Process files in batches to avoid overwhelming the system
     */
    static async* batchProcess<T, R>(
        items: T[],
        processor: (item: T) => Promise<R>,
        batchSize: number = this.PROCESSING_BATCH_SIZE
    ): AsyncGenerator<R[], void, unknown> {
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, Math.min(i + batchSize, items.length));
            console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(items.length/batchSize)} (${batch.length} items)`);
            
            const results = await Promise.all(batch.map(processor));
            yield results;
            
            // Yield to event loop between batches
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    /**
     * Adaptive compression: Reduce data size for transfer
     */
    static compressSummary(summary: string, maxLength: number = 50000): string {
        if (summary.length <= maxLength) return summary;
        
        console.log(`📉 Compressing summary from ${(summary.length/1024).toFixed(0)}KB to ${(maxLength/1024).toFixed(0)}KB`);
        
        // Keep important sections, summarize or remove verbose parts
        const sections = summary.split('\n\n');
        const importantSections = sections.filter(section => 
            section.includes('📊') || 
            section.includes('Security') ||
            section.includes('Vulnerability') ||
            section.includes('⚠️')
        );
        
        let compressed = importantSections.join('\n\n');
        
        // If still too large, truncate
        if (compressed.length > maxLength) {
            compressed = compressed.substring(0, maxLength) + '\n\n... [Summary truncated for performance]';
        }
        
        return compressed;
    }

    /**
     * Progressive loading: Load and analyze in stages
     */
    static async processInStages<T>(
        items: T[],
        stageProcessor: (stage: T[], stageNumber: number) => Promise<void>,
        stagesCount: number = 3
    ): Promise<void> {
        const stageSize = Math.ceil(items.length / stagesCount);
        
        for (let i = 0; i < stagesCount; i++) {
            const stageStart = i * stageSize;
            const stageEnd = Math.min(stageStart + stageSize, items.length);
            const stageItems = items.slice(stageStart, stageEnd);
            
            console.log(`🎯 Stage ${i + 1}/${stagesCount}: Processing ${stageItems.length} items`);
            await stageProcessor(stageItems, i + 1);
            
            // Force garbage collection hint
            if (typeof (globalThis as any).gc === 'function') {
                (globalThis as any).gc();
            }
        }
    }

    /**
     * Intelligent file filtering: Skip unnecessary files
     */
    static filterRelevantFiles(files: Map<string, any>): Map<string, any> {
        const filtered = new Map<string, any>();
        
        // Skip patterns (files unlikely to contain vulnerabilities)
        const skipPatterns = [
            /node_modules\//i,
            /\.min\.js$/i,
            /\.map$/i,
            /package-lock\.json$/i,
            /yarn\.lock$/i,
            /\.git\//i,
            /dist\//i,
            /build\//i,
            /coverage\//i,
            /\.next\//i,
            /\.nuxt\//i,
            /vendor\//i,
            /third[-_]party/i,
            /\.jpg$/i, /\.png$/i, /\.gif$/i, /\.svg$/i,
            /\.woff$/i, /\.ttf$/i, /\.eot$/i,
        ];
        
        let skippedCount = 0;
        let skippedSize = 0;
        
        for (const [path, content] of files) {
            const shouldSkip = skipPatterns.some(pattern => pattern.test(path));
            
            if (shouldSkip) {
                skippedCount++;
                skippedSize += content.code?.length || 0;
            } else {
                filtered.set(path, content);
            }
        }
        
        if (skippedCount > 0) {
            console.log(`⏩ Filtered out ${skippedCount} files (${(skippedSize/1024/1024).toFixed(1)}MB) - not relevant for security analysis`);
        }
        
        return filtered;
    }

    /**
     * Calculate optimal concurrency based on system resources
     */
    static getOptimalConcurrency(): number {
        // Check available resources
        const cores = navigator.hardwareConcurrency || 4;
        const memory = (navigator as any).deviceMemory || 4; // GB
        
        // Conservative formula: use 50% of cores, capped by memory
        let concurrency = Math.floor(cores / 2);
        
        // Reduce if low memory
        if (memory < 4) {
            concurrency = Math.min(concurrency, 2);
        } else if (memory < 8) {
            concurrency = Math.min(concurrency, 4);
        } else {
            concurrency = Math.min(concurrency, 8); // Max 8 concurrent ops
        }
        
        console.log(`⚙️ Optimal concurrency: ${concurrency} (${cores} cores, ${memory}GB RAM)`);
        return Math.max(1, concurrency); // At least 1
    }

    /**
     * Monitor and auto-adjust based on performance
     */
    static createAdaptiveThrottle(initialDelay: number = 100) {
        let delay = initialDelay;
        let lastDuration = 0;
        
        return {
            async execute<T>(fn: () => Promise<T>): Promise<T> {
                const start = Date.now();
                const result = await fn();
                lastDuration = Date.now() - start;
                
                // Adapt delay based on execution time
                if (lastDuration > 1000) {
                    delay = Math.min(delay * 1.5, 1000); // Increase delay
                } else if (lastDuration < 200) {
                    delay = Math.max(delay * 0.8, 10); // Decrease delay
                }
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return result;
            },
            getDelay: () => delay,
            getDuration: () => lastDuration
        };
    }

    /**
     * Estimate memory impact before processing
     */
    static estimateMemoryImpact(files: Map<string, any>): {
        estimatedMB: number;
        warning: string | null;
        recommendation: string | null;
    } {
        let totalSize = 0;
        for (const [_, content] of files) {
            totalSize += content.code?.length || 0;
        }
        
        // Rough estimate: 2x file size in memory during processing
        const estimatedMB = (totalSize * 2) / (1024 * 1024);
        
        let warning = null;
        let recommendation = null;
        
        if (estimatedMB > 500) {
            warning = 'Very large memory footprint detected';
            recommendation = 'Consider using smart sampling or filtering';
        } else if (estimatedMB > 200) {
            warning = 'Large memory footprint';
            recommendation = 'Processing may be slower on low-memory devices';
        }
        
        return { estimatedMB, warning, recommendation };
    }

    /**
     * Create checkpoint for resumable processing
     */
    static createCheckpoint(processedItems: number, totalItems: number, metadata: any = {}): string {
        const checkpoint = {
            timestamp: Date.now(),
            processed: processedItems,
            total: totalItems,
            percentage: Math.round((processedItems / totalItems) * 100),
            ...metadata
        };
        
        return JSON.stringify(checkpoint);
    }

    /**
     * Resume from checkpoint
     */
    static loadCheckpoint(checkpointData: string): {
        processed: number;
        total: number;
        percentage: number;
        timestamp: number;
    } | null {
        try {
            const checkpoint = JSON.parse(checkpointData);
            return {
                processed: checkpoint.processed,
                total: checkpoint.total,
                percentage: checkpoint.percentage,
                timestamp: checkpoint.timestamp
            };
        } catch {
            return null;
        }
    }
}

/**
 * Streaming response handler for large AI responses
 */
export class StreamingResponseHandler {
    private chunks: string[] = [];
    private onChunk?: (chunk: string) => void;

    constructor(onChunk?: (chunk: string) => void) {
        this.onChunk = onChunk;
    }

    addChunk(chunk: string): void {
        this.chunks.push(chunk);
        if (this.onChunk) {
            this.onChunk(chunk);
        }
    }

    getFullResponse(): string {
        return this.chunks.join('');
    }

    clear(): void {
        this.chunks = [];
    }
}

/**
 * Cache manager for repeated analyses
 */
export class AnalysisCache {
    private static readonly CACHE_KEY_PREFIX = 'cyberforge_cache_';
    private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    static async get(key: string): Promise<any | null> {
        try {
            const cacheKey = this.CACHE_KEY_PREFIX + key;
            const cached = localStorage.getItem(cacheKey);
            
            if (!cached) return null;
            
            const { data, timestamp } = JSON.parse(cached);
            
            // Check if expired
            if (Date.now() - timestamp > this.CACHE_TTL) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            
            console.log(`💾 Cache hit: ${key}`);
            return data;
        } catch {
            return null;
        }
    }

    static async set(key: string, data: any): Promise<void> {
        try {
            const cacheKey = this.CACHE_KEY_PREFIX + key;
            const cached = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cached));
            console.log(`💾 Cache set: ${key}`);
        } catch (e) {
            console.warn('⚠️ Failed to cache:', e);
        }
    }

    static clear(): void {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_KEY_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        console.log('🗑️ Cache cleared');
    }

    static getSize(): number {
        let size = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.CACHE_KEY_PREFIX)) {
                size += localStorage.getItem(key)?.length || 0;
            }
        });
        return size;
    }
}
