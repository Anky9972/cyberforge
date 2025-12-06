/**
 * PHASE 3: REAL FUZZING ENGINE
 *
 * This is a REAL fuzzing engine that executes JavaScript/TypeScript code
 * with mutated inputs and tracks crashes, not LLM simulation.
 *
 * Approach: Mutation-based fuzzing inspired by AFL++ and Atheris
 * - Generates mutated inputs based on function signatures
 * - Executes functions in isolated VM context
 * - Tracks crashes, exceptions, and hangs
 * - Measures code coverage (basic branch tracking)
 */
export interface FuzzResult {
    functionName: string;
    totalExecutions: number;
    crashes: FuzzCrash[];
    coverage: CoverageStats;
    duration: number;
}
export interface FuzzCrash {
    input: any[];
    error: string;
    stackTrace: string;
    crashType: 'exception' | 'timeout' | 'memory' | 'assertion';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
}
export interface CoverageStats {
    linesExecuted: Set<number>;
    branchesTaken: number;
    totalBranches: number;
    coveragePercent: number;
}
export interface FuzzConfig {
    maxExecutions: number;
    timeout: number;
    mutationStrategy: 'random' | 'smart' | 'hybrid';
}
export declare class JavaScriptFuzzingEngine {
    private config;
    private crashInputs;
    constructor(config?: Partial<FuzzConfig>);
    /**
     * Fuzz a single JavaScript function with generated inputs
     */
    fuzzFunction(code: string, functionName: string, paramTypes: string[]): Promise<FuzzResult>;
    /**
     * Execute function with timeout protection
     */
    private executeWithTimeout;
    /**
     * Generate mutated inputs based on parameter types
     * Uses AFL++-style mutation strategies
     */
    private generateMutatedInputs;
    /**
     * Mutate a single value based on type and iteration
     */
    private mutateValue;
    /**
     * Select mutation type based on strategy
     */
    private selectMutationType;
    /**
     * String mutation strategies
     */
    private mutateString;
    /**
     * Number mutation strategies
     */
    private mutateNumber;
    /**
     * Object mutation strategies
     */
    private mutateObject;
    /**
     * Array mutation strategies
     */
    private mutateArray;
    /**
     * Analyze crash to determine severity and type
     */
    private analyzeCrash;
    /**
     * Fuzz multiple functions from codebase
     */
    fuzzCodebase(codeFiles: Map<string, {
        code: string;
        language: string;
        filename: string;
    }>, targetFunctions: Array<{
        functionName: string;
        params: string[];
    }>): Promise<Map<string, FuzzResult>>;
}
/**
 * Generate realistic vulnerability report from fuzz results
 */
export declare function generateVulnerabilityFromFuzz(fuzzResult: FuzzResult): {
    title: string;
    description: string;
    vulnerableCode: string;
    mitigation: string;
} | null;
//# sourceMappingURL=fuzzingEngine.d.ts.map