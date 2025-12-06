/**
 * COVERAGE-GUIDED FUZZING ENGINE
 * Uses Istanbul for code instrumentation and coverage feedback
 * Implements AFL++-style coverage-guided fuzzing
 */
import type { CoverageMapData } from 'istanbul-lib-coverage';
export interface CoverageGuidedFuzzConfig {
    maxExecutions: number;
    timeout: number;
    coverageThreshold: number;
}
export interface CoverageFuzzResult {
    functionName: string;
    totalExecutions: number;
    crashes: FuzzCrash[];
    coverageData: CoverageMapData;
    coveragePercent: number;
    interestingInputs: any[][];
    duration: number;
}
export interface FuzzCrash {
    input: any[];
    error: string;
    stackTrace: string;
    crashType: 'exception' | 'timeout' | 'memory' | 'assertion';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
}
export declare class CoverageGuidedFuzzingEngine {
    private config;
    private instrumenter;
    private globalCoverage;
    constructor(config?: Partial<CoverageGuidedFuzzConfig>);
    /**
     * Fuzz function with coverage-guided input generation
     * Uses feedback loop to maximize code coverage
     */
    fuzzFunctionWithCoverage(code: string, functionName: string, paramTypes: string[]): Promise<CoverageFuzzResult>;
    /**
     * Calculate code coverage percentage from Istanbul coverage data
     */
    private calculateCoverage;
    /**
     * Generate initial seed inputs for fuzzing
     */
    private generateInitialInput;
    /**
     * Mutate an interesting input to explore nearby code paths
     * This is the core of AFL++-style fuzzing
     */
    private mutateInterestingInput;
    /**
     * Mutate a single value using various strategies
     */
    private mutateValue;
    /**
     * Analyze crash to determine severity and type
     */
    private analyzeCrash;
    /**
     * Generate detailed report from coverage-guided fuzzing results
     */
    generateReport(result: CoverageFuzzResult): string;
}
//# sourceMappingURL=coverageGuidedFuzzing.d.ts.map