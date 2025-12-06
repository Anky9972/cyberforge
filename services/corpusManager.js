/**
 * Corpus Manager & Seed Evolution Service
 *
 * Features:
 * - Versioned seed corpora per target
 * - Auto-prune with coverage-aware minimization
 * - "Promote to golden seed" functionality
 * - Seed quality scoring and evolution tracking
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
class CorpusManagerService {
    corpora = new Map();
    corpusDir = './corpus';
    constructor(corpusDir) {
        if (corpusDir)
            this.corpusDir = corpusDir;
    }
    /**
     * Initialize corpus for a target
     */
    async initializeCorpus(targetId) {
        const existing = this.corpora.get(targetId);
        if (existing)
            return existing;
        const corpus = {
            targetId,
            version: 1,
            seeds: new Map(),
            totalCoverage: new Set(),
            createdAt: new Date(),
            updatedAt: new Date(),
            stats: {
                totalSeeds: 0,
                goldenSeeds: 0,
                avgCoverageScore: 0,
                totalExecutions: 0,
                totalCrashes: 0
            }
        };
        this.corpora.set(targetId, corpus);
        // Try to load from disk
        try {
            await this.loadCorpusFromDisk(targetId);
        }
        catch (error) {
            // No existing corpus on disk, start fresh
        }
        return corpus;
    }
    /**
     * Add seed to corpus
     */
    async addSeed(targetId, content, metadata = {}) {
        const corpus = await this.initializeCorpus(targetId);
        // Calculate hash
        const contentStr = typeof content === 'string' ? content : content.toString('base64');
        const hash = crypto.createHash('sha256').update(contentStr).digest('hex').substring(0, 16);
        // Check if seed already exists
        if (corpus.seeds.has(hash)) {
            return corpus.seeds.get(hash);
        }
        const seed = {
            id: hash,
            content,
            hash,
            addedAt: new Date(),
            lastUsed: new Date(),
            executionCount: 0,
            coverageScore: 0,
            crashCount: 0,
            energy: 100, // Initial energy
            isGolden: false,
            metadata: {
                source: metadata.source || 'manual',
                parentId: metadata.parentId,
                tags: metadata.tags || [],
                size: typeof content === 'string' ? content.length : content.length
            }
        };
        corpus.seeds.set(hash, seed);
        corpus.stats.totalSeeds++;
        corpus.updatedAt = new Date();
        await this.saveCorpusToDisk(targetId);
        return seed;
    }
    /**
     * Update seed metrics after execution
     */
    async updateSeedMetrics(targetId, seedId, metrics) {
        const corpus = this.corpora.get(targetId);
        if (!corpus)
            return;
        const seed = corpus.seeds.get(seedId);
        if (!seed)
            return;
        // Update execution count
        seed.executionCount++;
        seed.lastUsed = new Date();
        corpus.stats.totalExecutions++;
        // Update coverage
        if (metrics.newCoverage && metrics.newCoverage.length > 0) {
            for (const edge of metrics.newCoverage) {
                corpus.totalCoverage.add(edge);
            }
            seed.coverageScore += metrics.newCoverage.length;
            // Boost energy for seeds that discover new coverage
            seed.energy = Math.min(200, seed.energy + 50);
        }
        else {
            // Decay energy for seeds not finding new coverage
            seed.energy = Math.max(10, seed.energy - 5);
        }
        // Update crash count
        if (metrics.foundCrash) {
            seed.crashCount++;
            corpus.stats.totalCrashes++;
            // Boost energy for crash-finding seeds
            seed.energy = Math.min(200, seed.energy + 100);
        }
        corpus.updatedAt = new Date();
    }
    /**
     * Promote seed to golden status
     */
    async promoteToGolden(targetId, seedId) {
        const corpus = this.corpora.get(targetId);
        if (!corpus)
            return false;
        const seed = corpus.seeds.get(seedId);
        if (!seed)
            return false;
        if (!seed.isGolden) {
            seed.isGolden = true;
            seed.energy = 200; // Max energy for golden seeds
            corpus.stats.goldenSeeds++;
            corpus.updatedAt = new Date();
            await this.saveCorpusToDisk(targetId);
        }
        return true;
    }
    /**
     * Coverage-aware corpus minimization
     * Keeps only seeds that contribute unique coverage
     */
    async minimizeCorpus(targetId) {
        const corpus = this.corpora.get(targetId);
        if (!corpus)
            throw new Error(`Corpus not found: ${targetId}`);
        const beforeCount = corpus.seeds.size;
        const beforeCoverage = corpus.totalCoverage.size;
        // Build coverage map: edge -> seeds that cover it
        const coverageMap = new Map();
        const seedCoverageMap = new Map();
        // Simulate coverage data (in production, this comes from instrumentation)
        for (const [seedId, seed] of corpus.seeds.entries()) {
            const edges = this.simulateSeedCoverage(seed);
            seedCoverageMap.set(seedId, edges);
            for (const edge of edges) {
                if (!coverageMap.has(edge)) {
                    coverageMap.set(edge, new Set());
                }
                coverageMap.get(edge).add(seedId);
            }
        }
        // Greedy set cover: keep seeds that cover unique edges
        const keptSeeds = new Set();
        const coveredEdges = new Set();
        // Always keep golden seeds
        for (const [seedId, seed] of corpus.seeds.entries()) {
            if (seed.isGolden) {
                keptSeeds.add(seedId);
                const edges = seedCoverageMap.get(seedId);
                for (const edge of edges) {
                    coveredEdges.add(edge);
                }
            }
        }
        // Greedy selection: pick seed that covers most uncovered edges
        const remainingSeeds = Array.from(corpus.seeds.keys()).filter(id => !keptSeeds.has(id));
        while (remainingSeeds.length > 0 && coveredEdges.size < corpus.totalCoverage.size) {
            let bestSeed = null;
            let bestNewCoverage = 0;
            for (const seedId of remainingSeeds) {
                const edges = seedCoverageMap.get(seedId);
                const newCoverage = Array.from(edges).filter(e => !coveredEdges.has(e)).length;
                if (newCoverage > bestNewCoverage) {
                    bestNewCoverage = newCoverage;
                    bestSeed = seedId;
                }
            }
            if (bestSeed && bestNewCoverage > 0) {
                keptSeeds.add(bestSeed);
                const edges = seedCoverageMap.get(bestSeed);
                for (const edge of edges) {
                    coveredEdges.add(edge);
                }
                remainingSeeds.splice(remainingSeeds.indexOf(bestSeed), 1);
            }
            else {
                break; // No more valuable seeds
            }
        }
        // Remove seeds not in kept set
        const pruned = [];
        for (const [seedId, seed] of corpus.seeds.entries()) {
            if (!keptSeeds.has(seedId)) {
                corpus.seeds.delete(seedId);
                pruned.push(seedId);
            }
        }
        const afterCount = corpus.seeds.size;
        const prunedCount = beforeCount - afterCount;
        // Update stats
        corpus.stats.totalSeeds = afterCount;
        corpus.stats.goldenSeeds = Array.from(corpus.seeds.values()).filter(s => s.isGolden).length;
        corpus.stats.avgCoverageScore = this.calculateAverageCoverageScore(corpus);
        corpus.version++;
        corpus.updatedAt = new Date();
        await this.saveCorpusToDisk(targetId);
        return {
            generationNumber: corpus.version,
            newCoveragePercent: 0,
            pruned: prunedCount,
            added: 0,
            promoted: corpus.stats.goldenSeeds,
            avgEnergy: this.calculateAverageEnergy(corpus)
        };
    }
    /**
     * Simulate seed coverage (placeholder for real coverage data)
     */
    simulateSeedCoverage(seed) {
        const edges = new Set();
        const content = typeof seed.content === 'string' ? seed.content : seed.content.toString();
        // Simulate: hash content to generate "coverage" edges
        const hash = crypto.createHash('md5').update(content).digest('hex');
        const edgeCount = 10 + (seed.coverageScore % 50);
        for (let i = 0; i < edgeCount; i++) {
            const edgeHash = crypto.createHash('md5').update(`${hash}-${i}`).digest('hex').substring(0, 8);
            edges.add(`edge-${edgeHash}`);
        }
        return edges;
    }
    /**
     * Calculate average coverage score
     */
    calculateAverageCoverageScore(corpus) {
        if (corpus.seeds.size === 0)
            return 0;
        const total = Array.from(corpus.seeds.values()).reduce((sum, s) => sum + s.coverageScore, 0);
        return Math.round(total / corpus.seeds.size);
    }
    /**
     * Calculate average energy
     */
    calculateAverageEnergy(corpus) {
        if (corpus.seeds.size === 0)
            return 0;
        const total = Array.from(corpus.seeds.values()).reduce((sum, s) => sum + s.energy, 0);
        return Math.round(total / corpus.seeds.size);
    }
    /**
     * Get seeds sorted by energy (for fuzzing prioritization)
     */
    getSeedsByEnergy(targetId, limit = 100) {
        const corpus = this.corpora.get(targetId);
        if (!corpus)
            return [];
        return Array.from(corpus.seeds.values())
            .sort((a, b) => b.energy - a.energy)
            .slice(0, limit);
    }
    /**
     * Get golden seeds
     */
    getGoldenSeeds(targetId) {
        const corpus = this.corpora.get(targetId);
        if (!corpus)
            return [];
        return Array.from(corpus.seeds.values()).filter(s => s.isGolden);
    }
    /**
     * Get corpus statistics
     */
    getCorpusStats(targetId) {
        const corpus = this.corpora.get(targetId);
        if (!corpus)
            return null;
        return {
            ...corpus.stats,
            version: corpus.version,
            uniqueCoverage: corpus.totalCoverage.size,
            createdAt: corpus.createdAt,
            updatedAt: corpus.updatedAt,
            seedDistribution: {
                golden: corpus.stats.goldenSeeds,
                highEnergy: Array.from(corpus.seeds.values()).filter(s => s.energy > 150).length,
                mediumEnergy: Array.from(corpus.seeds.values()).filter(s => s.energy >= 50 && s.energy <= 150).length,
                lowEnergy: Array.from(corpus.seeds.values()).filter(s => s.energy < 50).length
            }
        };
    }
    /**
     * Save corpus to disk
     */
    async saveCorpusToDisk(targetId) {
        const corpus = this.corpora.get(targetId);
        if (!corpus)
            return;
        const targetDir = path.join(this.corpusDir, targetId);
        try {
            await fs.mkdir(targetDir, { recursive: true });
            // Save seeds
            for (const [seedId, seed] of corpus.seeds.entries()) {
                const seedPath = path.join(targetDir, `${seedId}.seed`);
                const seedData = {
                    ...seed,
                    content: typeof seed.content === 'string' ? seed.content : seed.content.toString('base64')
                };
                await fs.writeFile(seedPath, JSON.stringify(seedData, null, 2));
            }
            // Save corpus metadata
            const metadataPath = path.join(targetDir, 'corpus.json');
            const metadata = {
                targetId: corpus.targetId,
                version: corpus.version,
                totalCoverage: Array.from(corpus.totalCoverage),
                createdAt: corpus.createdAt,
                updatedAt: corpus.updatedAt,
                stats: corpus.stats
            };
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        }
        catch (error) {
            console.error(`Failed to save corpus to disk: ${error}`);
        }
    }
    /**
     * Load corpus from disk
     */
    async loadCorpusFromDisk(targetId) {
        const targetDir = path.join(this.corpusDir, targetId);
        const metadataPath = path.join(targetDir, 'corpus.json');
        try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            const corpus = {
                targetId: metadata.targetId,
                version: metadata.version,
                seeds: new Map(),
                totalCoverage: new Set(metadata.totalCoverage),
                createdAt: new Date(metadata.createdAt),
                updatedAt: new Date(metadata.updatedAt),
                stats: metadata.stats
            };
            // Load seeds
            const files = await fs.readdir(targetDir);
            for (const file of files) {
                if (file.endsWith('.seed')) {
                    const seedPath = path.join(targetDir, file);
                    const seedContent = await fs.readFile(seedPath, 'utf-8');
                    const seedData = JSON.parse(seedContent);
                    const seed = {
                        ...seedData,
                        addedAt: new Date(seedData.addedAt),
                        lastUsed: new Date(seedData.lastUsed),
                        content: seedData.metadata?.isBuffer
                            ? Buffer.from(seedData.content, 'base64')
                            : seedData.content
                    };
                    corpus.seeds.set(seed.id, seed);
                }
            }
            this.corpora.set(targetId, corpus);
        }
        catch (error) {
            throw new Error(`Failed to load corpus from disk: ${error}`);
        }
    }
    /**
     * Export corpus for sharing
     */
    async exportCorpus(targetId) {
        const corpus = this.corpora.get(targetId);
        if (!corpus)
            throw new Error(`Corpus not found: ${targetId}`);
        return {
            targetId: corpus.targetId,
            version: corpus.version,
            exportedAt: new Date().toISOString(),
            stats: corpus.stats,
            seeds: Array.from(corpus.seeds.values()).map(seed => ({
                id: seed.id,
                hash: seed.hash,
                content: typeof seed.content === 'string' ? seed.content : seed.content.toString('base64'),
                isGolden: seed.isGolden,
                coverageScore: seed.coverageScore,
                crashCount: seed.crashCount,
                metadata: seed.metadata
            }))
        };
    }
    /**
     * Import corpus
     */
    async importCorpus(data) {
        const corpus = await this.initializeCorpus(data.targetId);
        for (const seedData of data.seeds) {
            await this.addSeed(data.targetId, seedData.content, seedData.metadata);
            if (seedData.isGolden) {
                await this.promoteToGolden(data.targetId, seedData.id);
            }
        }
    }
}
// Singleton instance
export const corpusManager = new CorpusManagerService();
//# sourceMappingURL=corpusManager.js.map