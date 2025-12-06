/**
 * Enhanced Symbolic Execution Engine with Z3 Solver
 * Analyzes path constraints and generates intelligent test inputs
 */
interface PathConstraint {
    condition: string;
    path: string[];
    variables: Set<string>;
    type: 'if' | 'while' | 'for' | 'switch';
}
interface GeneratedInput {
    variables: Map<string, any>;
    path: string[];
    satisfies: string;
}
declare class EnhancedSymbolicExecutor {
    private z3Context;
    private initialized;
    /**
     * Initialize Z3 solver
     */
    initialize(): Promise<void>;
    /**
     * Extract path constraints from AST
     */
    extractConstraints(code: string, language?: string): PathConstraint[];
    /**
     * Analyze path constraints and generate inputs
     */
    analyzePathConstraints(constraints: PathConstraint[]): Promise<GeneratedInput[]>;
    /**
     * Parse constraint string to Z3 expression (simplified)
     */
    private parseConstraintToZ3;
    /**
     * Generate test cases for all branches
     */
    generateTestCases(code: string, language?: string): Promise<any[]>;
    /**
     * Find inputs that reach specific code location
     */
    findInputsForLocation(code: string, targetLine: number): Promise<GeneratedInput[]>;
    /**
     * Cleanup
     */
    shutdown(): Promise<void>;
}
export declare const enhancedSymbolicExecutor: EnhancedSymbolicExecutor;
export default EnhancedSymbolicExecutor;
//# sourceMappingURL=enhancedSymbolicExecutor.d.ts.map