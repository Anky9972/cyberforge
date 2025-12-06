/**
 * Crash Deduplication & Root-Cause Analysis Service
 *
 * Features:
 * - Fingerprint crashes by stack-hash + signal + coverage bitmap
 * - Auto-minimize inputs using delta-debugging
 * - Attach cause suspects (tainted vars, mutated fields)
 */
export interface CrashInfo {
    id: string;
    timestamp: Date;
    signal?: string;
    stackTrace: string;
    input: string | Buffer;
    coverageBitmap?: number[];
    errorMessage?: string;
    taintedVars?: string[];
    mutatedFields?: string[];
}
export interface CrashFingerprint {
    hash: string;
    stackHash: string;
    signal: string;
    coverageHash: string;
}
export interface MinimizedCrash {
    original: CrashInfo;
    minimized: {
        input: string | Buffer;
        reductionPercent: number;
        iterations: number;
    };
    rootCause: {
        likelyCause: string;
        suspectVars: string[];
        mutatedFields: string[];
        confidence: number;
    };
}
export interface CrashCluster {
    fingerprint: CrashFingerprint;
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    crashes: CrashInfo[];
    representative: CrashInfo;
    severity: 'critical' | 'high' | 'medium' | 'low';
    exploitability?: number;
}
declare class CrashDeduplicationService {
    private crashClusters;
    /**
     * Generate a unique fingerprint for a crash
     */
    generateFingerprint(crash: CrashInfo): CrashFingerprint;
    /**
     * Normalize stack trace for consistent hashing
     */
    private normalizeStackTrace;
    /**
     * Extract signal/error type from stack trace
     */
    private extractSignalFromStack;
    /**
     * Add a crash to the deduplication system
     */
    addCrash(crash: CrashInfo): CrashCluster;
    /**
     * Calculate crash severity based on signal and context
     */
    private calculateSeverity;
    /**
     * Get input size (string or buffer)
     */
    private getInputSize;
    /**
     * Delta-debugging input minimization
     * Finds the smallest input that still triggers the crash
     */
    minimizeInput(crash: CrashInfo, testFunction: (input: string | Buffer) => Promise<boolean>): Promise<MinimizedCrash>;
    /**
     * Analyze root cause suspects
     */
    private analyzeRootCause;
    /**
     * Infer tainted variables from stack trace and input
     */
    private inferTaintedVars;
    /**
     * Infer mutated fields from minimized input
     */
    private inferMutatedFields;
    /**
     * Get all unique crash clusters
     */
    getClusters(): CrashCluster[];
    /**
     * Get crash statistics
     */
    getStats(): {
        totalCrashes: number;
        uniqueCrashes: number;
        deduplicationRate: number;
        bySeverity: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        clusters: CrashCluster[];
    };
    /**
     * Export crash cluster for reporting
     */
    exportCluster(fingerprint: string): {
        fingerprint: CrashFingerprint;
        count: number;
        severity: "critical" | "high" | "medium" | "low";
        firstSeen: string;
        lastSeen: string;
        representative: {
            stackTrace: string;
            input: string | Buffer<ArrayBufferLike>;
            errorMessage: string | undefined;
        };
        allInputs: (string | Buffer<ArrayBufferLike>)[];
    } | null;
    /**
     * Clear all clusters (for testing)
     */
    clear(): void;
}
export declare const crashDeduplicationService: CrashDeduplicationService;
export {};
//# sourceMappingURL=crashDeduplication.d.ts.map