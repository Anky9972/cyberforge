/**
 * LRU Corpus Manager Service
 * Implements bounded corpus cache with automatic archival to prevent memory exhaustion
 */

import { LRUCache } from 'lru-cache';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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

class LRUCorpusManager {
  private cache: LRUCache<string, CorpusSeed>;
  private archivePath: string;
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    const maxSeeds = parseInt(process.env.CORPUS_MAX_SEEDS || '10000');
    const maxSize = parseInt(process.env.CORPUS_MAX_SIZE || String(100 * 1024 * 1024)); // 100MB

    this.archivePath = path.join(process.cwd(), 'corpus-archive');
    
    this.cache = new LRUCache<string, CorpusSeed>({
      max: maxSeeds,
      maxSize: maxSize,
      sizeCalculation: (seed) => {
        const inputSize = Buffer.isBuffer(seed.input) 
          ? seed.input.length 
          : Buffer.byteLength(seed.input);
        const coverageSize = seed.coverage.length * 4; // Approximate size
        return inputSize + coverageSize + 100; // Add overhead
      },
      dispose: async (seed, key) => {
        // Archive seed before eviction
        await this.archiveSeed(seed);
      },
      ttl: 1000 * 60 * 60 * 24, // 24 hours
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });

    this.initializeArchive();
  }

  /**
   * Initialize archive directory
   */
  private async initializeArchive(): Promise<void> {
    try {
      await fs.mkdir(this.archivePath, { recursive: true });
    } catch (error) {
      console.error('Error initializing corpus archive:', error);
    }
  }

  /**
   * Generate unique seed ID
   */
  private generateSeedId(input: string | Buffer): string {
    const content = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Add seed to corpus
   */
  async addSeed(seed: Omit<CorpusSeed, 'id' | 'timestamp'>): Promise<string> {
    const id = this.generateSeedId(seed.input);
    
    const fullSeed: CorpusSeed = {
      id,
      ...seed,
      timestamp: Date.now()
    };

    this.cache.set(id, fullSeed);
    
    return id;
  }

  /**
   * Get seed from corpus
   */
  getSeed(seedId: string): CorpusSeed | undefined {
    const seed = this.cache.get(seedId);
    
    if (seed) {
      this.hits++;
      return seed;
    } else {
      this.misses++;
      return undefined;
    }
  }

  /**
   * Check if seed exists
   */
  hasSeed(seedId: string): boolean {
    return this.cache.has(seedId);
  }

  /**
   * Get multiple seeds
   */
  getSeeds(count: number = 10): CorpusSeed[] {
    const seeds: CorpusSeed[] = [];
    const entries = this.cache.entries();
    
    let collected = 0;
    for (const [_, seed] of entries) {
      if (collected >= count) break;
      seeds.push(seed);
      collected++;
    }
    
    return seeds;
  }

  /**
   * Get seeds with highest coverage
   */
  getTopSeeds(count: number = 10): CorpusSeed[] {
    const allSeeds: CorpusSeed[] = Array.from(this.cache.values()) as CorpusSeed[];
    
    return allSeeds
      .sort((a, b) => b.coverage.length - a.coverage.length)
      .slice(0, count);
  }

  /**
   * Archive seed to disk
   */
  private async archiveSeed(seed: CorpusSeed): Promise<void> {
    try {
      const archiveFile = path.join(this.archivePath, `${seed.id}.json`);
      
      await fs.writeFile(
        archiveFile,
        JSON.stringify(seed, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Error archiving seed:', error);
    }
  }

  /**
   * Load archived seed
   */
  async loadArchivedSeed(seedId: string): Promise<CorpusSeed | null> {
    try {
      const archiveFile = path.join(this.archivePath, `${seedId}.json`);
      const content = await fs.readFile(archiveFile, 'utf-8');
      const seed = JSON.parse(content);
      
      // Add back to cache
      this.cache.set(seedId, seed);
      
      return seed;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get corpus statistics
   */
  async getStats(): Promise<CorpusStats> {
    const totalSeeds = this.cache.size;
    const cacheSize = this.cache.calculatedSize || 0;
    
    // Count archived seeds
    let archivedSeeds = 0;
    try {
      const files = await fs.readdir(this.archivePath);
      archivedSeeds = files.filter(f => f.endsWith('.json')).length;
    } catch (error) {
      // Archive directory might not exist yet
    }
    
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    
    return {
      totalSeeds,
      cacheSize,
      archivedSeeds,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: `${(cacheSize / (1024 * 1024)).toFixed(2)} MB`
    };
  }

  /**
   * Clear corpus cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Prune old seeds
   */
  async pruneOldSeeds(maxAgeMs: number = 1000 * 60 * 60 * 24 * 7): Promise<number> {
    const now = Date.now();
    let pruned = 0;
    
    for (const [id, seed] of this.cache.entries()) {
      if (now - seed.timestamp > maxAgeMs) {
        await this.archiveSeed(seed);
        this.cache.delete(id);
        pruned++;
      }
    }
    
    return pruned;
  }

  /**
   * Export corpus to file
   */
  async exportCorpus(outputPath: string): Promise<void> {
    const seeds = Array.from(this.cache.values());
    
    await fs.writeFile(
      outputPath,
      JSON.stringify(seeds, null, 2),
      'utf-8'
    );
  }

  /**
   * Import corpus from file
   */
  async importCorpus(inputPath: string): Promise<number> {
    try {
      const content = await fs.readFile(inputPath, 'utf-8');
      const seeds = JSON.parse(content) as CorpusSeed[];
      
      for (const seed of seeds) {
        this.cache.set(seed.id, seed);
      }
      
      return seeds.length;
    } catch (error) {
      console.error('Error importing corpus:', error);
      throw error;
    }
  }

  /**
   * Get cache capacity info
   */
  getCapacity(): {
    current: number;
    max: number;
    percentage: number;
  } {
    const current = this.cache.size;
    const max = this.cache.max;
    const percentage = (current / max) * 100;
    
    return {
      current,
      max,
      percentage: Math.round(percentage * 100) / 100
    };
  }
}

export const lruCorpusManager = new LRUCorpusManager();
export default lruCorpusManager;
