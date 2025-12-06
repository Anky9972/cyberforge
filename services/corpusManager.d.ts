/**
 * Corpus Manager & Seed Evolution Service
 *
 * Features:
 * - Versioned seed corpora per target
 * - Auto-prune with coverage-aware minimization
 * - "Promote to golden seed" functionality
 * - Seed quality scoring and evolution tracking
 */
export interface Seed {
    id: string;
    content: string | Buffer;
    hash: string;
    addedAt: Date;
    lastUsed: Date;
    executionCount: number;
    coverageScore: number;
    crashCount: number;
    energy: number;
    isGolden: boolean;
    metadata: {
        source: 'manual' | 'generated' | 'minimized' | 'mutated';
        parentId?: string;
        tags?: string[];
        size: number;
    };
}
export interface Corpus {
    targetId: string;
    version: number;
    seeds: Map<string, Seed>;
    totalCoverage: Set<string>;
    createdAt: Date;
    updatedAt: Date;
    stats: {
        totalSeeds: number;
        goldenSeeds: number;
        avgCoverageScore: number;
        totalExecutions: number;
        totalCrashes: number;
    };
}
export interface SeedEvolutionMetrics {
    generationNumber: number;
    newCoveragePercent: number;
    pruned: number;
    added: number;
    promoted: number;
    avgEnergy: number;
}
declare class CorpusManagerService {
    private corpora;
    private corpusDir;
    constructor(corpusDir?: string);
    /**
     * Initialize corpus for a target
     */
    initializeCorpus(targetId: string): Promise<Corpus>;
    /**
     * Add seed to corpus
     */
    addSeed(targetId: string, content: string | Buffer, metadata?: Partial<Seed['metadata']>): Promise<Seed>;
    /**
     * Update seed metrics after execution
     */
    updateSeedMetrics(targetId: string, seedId: string, metrics: {
        newCoverage?: string[];
        foundCrash?: boolean;
    }): Promise<void>;
    /**
     * Promote seed to golden status
     */
    promoteToGolden(targetId: string, seedId: string): Promise<boolean>;
    /**
     * Coverage-aware corpus minimization
     * Keeps only seeds that contribute unique coverage
     */
    minimizeCorpus(targetId: string): Promise<SeedEvolutionMetrics>;
    /**
     * Simulate seed coverage (placeholder for real coverage data)
     */
    private simulateSeedCoverage;
    /**
     * Calculate average coverage score
     */
    private calculateAverageCoverageScore;
    /**
     * Calculate average energy
     */
    private calculateAverageEnergy;
    /**
     * Get seeds sorted by energy (for fuzzing prioritization)
     */
    getSeedsByEnergy(targetId: string, limit?: number): Seed[];
    /**
     * Get golden seeds
     */
    getGoldenSeeds(targetId: string): Seed[];
    /**
     * Get corpus statistics
     */
    getCorpusStats(targetId: string): {
        version: number;
        uniqueCoverage: number;
        createdAt: Date;
        updatedAt: Date;
        seedDistribution: {
            golden: number;
            highEnergy: number;
            mediumEnergy: number;
            lowEnergy: number;
        };
        totalSeeds: number;
        goldenSeeds: number;
        avgCoverageScore: number;
        totalExecutions: number;
        totalCrashes: number;
    } | null;
    /**
     * Save corpus to disk
     */
    private saveCorpusToDisk;
    /**
     * Load corpus from disk
     */
    private loadCorpusFromDisk;
    /**
     * Export corpus for sharing
     */
    exportCorpus(targetId: string): Promise<object>;
    /**
     * Import corpus
     */
    importCorpus(data: any): Promise<void>;
}
export declare const corpusManager: CorpusManagerService;
export {};
//# sourceMappingURL=corpusManager.d.ts.map