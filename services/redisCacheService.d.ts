/**
 * Redis Cache Service
 * Provides caching layer for analysis results, AST parsing, and frequently accessed data
 */
interface CacheOptions {
    ttl?: number;
    compress?: boolean;
}
declare class RedisCacheService {
    private redis;
    private readonly DEFAULT_TTL;
    private readonly PREFIX;
    constructor();
    /**
     * Initialize Redis connection
     */
    connect(): Promise<void>;
    /**
     * Generate cache key from code content
     */
    generateCodeHash(code: string): string;
    /**
     * Cache analysis result
     */
    cacheAnalysis(codeHash: string, result: any, options?: CacheOptions): Promise<void>;
    /**
     * Get cached analysis result
     */
    getCachedAnalysis(codeHash: string): Promise<any | null>;
    /**
     * Cache AST parsing result
     */
    cacheAST(codeHash: string, ast: any, options?: CacheOptions): Promise<void>;
    /**
     * Get cached AST
     */
    getCachedAST(codeHash: string): Promise<any | null>;
    /**
     * Cache vulnerability scan result
     */
    cacheScanResult(scanId: string, result: any, ttl?: number): Promise<void>;
    /**
     * Get cached scan result
     */
    getCachedScanResult(scanId: string): Promise<any | null>;
    /**
     * Cache project data
     */
    cacheProject(projectId: string, data: any, ttl?: number): Promise<void>;
    /**
     * Get cached project
     */
    getCachedProject(projectId: string): Promise<any | null>;
    /**
     * Invalidate cache for a specific key pattern
     */
    invalidate(pattern: string): Promise<void>;
    /**
     * Invalidate all project-related caches
     */
    invalidateProject(projectId: string): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): Promise<{
        totalKeys: number;
        memoryUsed: string;
        hitRate: number;
    }>;
    /**
     * Clear all cache
     */
    clearAll(): Promise<void>;
    /**
     * Close Redis connection
     */
    disconnect(): Promise<void>;
}
export declare const redisCacheService: RedisCacheService;
export default redisCacheService;
//# sourceMappingURL=redisCacheService.d.ts.map