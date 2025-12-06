/**
 * LRU Corpus Manager Service
 * Implements bounded corpus cache with automatic archival to prevent memory exhaustion
 */
interface CorpusSeed {
    id: string;
    input: string | Buffer;
    coverage: number[];
    timestamp: number;
    metadata?: {
        source?: string;
        crashCount?: number;
        executionTime?: number;
    };
}
interface CorpusStats {
    totalSeeds: number;
    cacheSize: number;
    archivedSeeds: number;
    hitRate: number;
    memoryUsage: string;
}
declare class LRUCorpusManager {
    private cache;
    private archivePath;
    private hits;
    private misses;
    constructor();
    /**
     * Initialize archive directory
     */
    private initializeArchive;
    /**
     * Generate unique seed ID
     */
    private generateSeedId;
    /**
     * Add seed to corpus
     */
    addSeed(seed: Omit<CorpusSeed, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Get seed from corpus
     */
    getSeed(seedId: string): CorpusSeed | undefined;
    /**
     * Check if seed exists
     */
    hasSeed(seedId: string): boolean;
    /**
     * Get multiple seeds
     */
    getSeeds(count?: number): CorpusSeed[];
    /**
     * Get seeds with highest coverage
     */
    getTopSeeds(count?: number): CorpusSeed[];
    /**
     * Archive seed to disk
     */
    private archiveSeed;
    /**
     * Load archived seed
     */
    loadArchivedSeed(seedId: string): Promise<CorpusSeed | null>;
    /**
     * Get corpus statistics
     */
    getStats(): Promise<CorpusStats>;
    /**
     * Clear corpus cache
     */
    clear(): void;
    /**
     * Prune old seeds
     */
    pruneOldSeeds(maxAgeMs?: number): Promise<number>;
    /**
     * Export corpus to file
     */
    exportCorpus(outputPath: string): Promise<void>;
    /**
     * Import corpus from file
     */
    importCorpus(inputPath: string): Promise<number>;
    /**
     * Get cache capacity info
     */
    getCapacity(): {
        current: number;
        max: number;
        percentage: number;
    };
}
export declare const lruCorpusManager: LRUCorpusManager;
export default lruCorpusManager;
//# sourceMappingURL=lruCorpusManager.d.ts.map