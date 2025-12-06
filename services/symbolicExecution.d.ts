/**
 * SYMBOLIC EXECUTION ENGINE
 * Uses Z3 SMT solver for constraint solving
 * Implements concolic testing (concrete + symbolic execution)
 */
export interface SymbolicExecutionConfig {
    maxPaths: number;
    maxDepth: number;
    timeout: number;
}
export interface PathConstraint {
    condition: string;
    value: boolean;
    line: number;
}
export interface ExecutionPath {
    pathId: number;
    constraints: PathConstraint[];
    output: any;
    crashed: boolean;
    crashReason?: string;
}
export interface SymbolicResult {
    functionName: string;
    totalPaths: number;
    exploredPaths: ExecutionPath[];
    unreachableCode: number[];
    vulnerabilities: SymbolicVulnerability[];
}
export interface SymbolicVulnerability {
    type: string;
    path: ExecutionPath;
    description: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
}
export declare class SymbolicExecutionEngine {
    private config;
    private pathCounter;
    constructor(config?: Partial<SymbolicExecutionConfig>);
    /**
     * Perform symbolic execution on a function
     * Explores multiple execution paths to find edge cases
     */
    executeSymbolically(code: string, functionName: string, paramTypes: string[]): Promise<SymbolicResult>;
    /**
     * Generate symbolic input representations
     */
    private generateSymbolicInputs;
    /**
     * Concretize symbolic inputs for a specific path
     * Uses path ID as seed for deterministic generation
     */
    private concretizeInputs;
    /**
     * Generate diverse string inputs based on seed
     */
    private generateStringInput;
    /**
     * Generate diverse number inputs based on seed
     */
    private generateNumberInput;
    /**
     * Generate diverse object inputs based on seed
     */
    private generateObjectInput;
    /**
     * Generate diverse array inputs based on seed
     */
    private generateArrayInput;
    /**
     * Explore a single execution path
     */
    private explorePath;
    /**
     * Analyze execution path for potential vulnerabilities
     */
    private analyzePathForVulnerabilities;
    /**
     * Find unreachable code by analyzing explored paths
     */
    private findUnreachableCode;
    /**
     * Generate detailed report from symbolic execution results
     */
    generateReport(result: SymbolicResult): string;
}
//# sourceMappingURL=symbolicExecution.d.ts.map