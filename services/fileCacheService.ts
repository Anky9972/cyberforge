/**
 * File Cache Service
 * Hash-based caching to skip re-scanning unchanged files
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import Redis from 'ioredis';

export interface CachedFile {
  filePath: string;
  hash: string;
  lastScanned: Date;
  vulnerabilities: number;
  highestSeverity?: string;
}

export class FileCacheService {
  private redis: Redis;
  private cachePrefix = 'file:cache:';
  private cacheTTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    console.log('✅ File cache service initialized');
  }

  /**
   * Compute SHA-256 hash of file content
   */
  async computeFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Check if file has changed since last scan
   */
  async hasFileChanged(filePath: string): Promise<boolean> {
    try {
      const currentHash = await this.computeFileHash(filePath);
      const cachedData = await this.getCachedFile(filePath);

      if (!cachedData) {
        return true; // Never scanned before
      }

      return currentHash !== cachedData.hash;
    } catch (error) {
      console.error(`Error checking file change: ${filePath}`, error);
      return true; // Assume changed if error
    }
  }

  /**
   * Get cached file data
   */
  async getCachedFile(filePath: string): Promise<CachedFile | null> {
    const key = this.cachePrefix + filePath;
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    const cached = JSON.parse(data);
    cached.lastScanned = new Date(cached.lastScanned);
    return cached as CachedFile;
  }

  /**
   * Cache file scan results
   */
  async cacheFile(
    filePath: string,
    hash: string,
    vulnerabilities: number,
    highestSeverity?: string
  ): Promise<void> {
    const cached: CachedFile = {
      filePath,
      hash,
      lastScanned: new Date(),
      vulnerabilities,
      highestSeverity,
    };

    const key = this.cachePrefix + filePath;
    await this.redis.setex(key, this.cacheTTL, JSON.stringify(cached));
  }

  /**
   * Cache file with current hash
   */
  async cacheFileWithCurrentHash(
    filePath: string,
    vulnerabilities: number,
    highestSeverity?: string
  ): Promise<void> {
    const hash = await this.computeFileHash(filePath);
    await this.cacheFile(filePath, hash, vulnerabilities, highestSeverity);
  }

  /**
   * Invalidate cache for specific file
   */
  async invalidateFile(filePath: string): Promise<void> {
    const key = this.cachePrefix + filePath;
    await this.redis.del(key);
  }

  /**
   * Invalidate cache for multiple files
   */
  async invalidateFiles(filePaths: string[]): Promise<void> {
    const keys = filePaths.map(fp => this.cachePrefix + fp);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    const keys = await this.redis.keys(this.cachePrefix + '*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    console.log(`🧹 Cleared ${keys.length} cached files`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalCached: number;
    cacheSize: string;
    oldestEntry?: Date;
    newestEntry?: Date;
  }> {
    const keys = await this.redis.keys(this.cachePrefix + '*');
    
    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;

    for (const key of keys.slice(0, 100)) { // Sample first 100
      const data = await this.redis.get(key);
      if (data) {
        const cached = JSON.parse(data);
        const scannedDate = new Date(cached.lastScanned);
        
        if (!oldestEntry || scannedDate < oldestEntry) {
          oldestEntry = scannedDate;
        }
        if (!newestEntry || scannedDate > newestEntry) {
          newestEntry = scannedDate;
        }
      }
    }

    // Estimate cache size (rough)
    const cacheSize = keys.length > 0 
      ? `~${Math.round(keys.length * 0.5)} KB` // Rough estimate
      : '0 KB';

    return {
      totalCached: keys.length,
      cacheSize,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Batch check which files have changed
   */
  async getChangedFiles(filePaths: string[]): Promise<{
    changed: string[];
    unchanged: string[];
  }> {
    const changed: string[] = [];
    const unchanged: string[] = [];

    for (const filePath of filePaths) {
      const hasChanged = await this.hasFileChanged(filePath);
      if (hasChanged) {
        changed.push(filePath);
      } else {
        unchanged.push(filePath);
      }
    }

    return { changed, unchanged };
  }

  /**
   * Get cached vulnerabilities for files
   */
  async getCachedVulnerabilities(filePaths: string[]): Promise<Map<string, CachedFile>> {
    const result = new Map<string, CachedFile>();

    for (const filePath of filePaths) {
      const cached = await this.getCachedFile(filePath);
      if (cached) {
        result.set(filePath, cached);
      }
    }

    return result;
  }
}

export const fileCacheService = new FileCacheService();
