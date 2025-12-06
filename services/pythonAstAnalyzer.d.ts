/**
 * REAL Python AST Analysis using tree-sitter
 * No more regex hacks - actual syntax tree parsing
 */
import type { CKGData } from '../types';
export interface PythonSecurityPattern {
    type: string;
    line: number;
    code: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    confidence: number;
    description: string;
}
export declare class PythonASTAnalyzer {
    private parser;
    constructor();
    /**
     * Parse Python code into AST and extract Code Knowledge Graph
     */
    analyzePythonCode(code: string, filename: string): CKGData;
    /**
     * Extract parameter names from function parameters node
     */
    private extractParameters;
    /**
     * Extract all function calls within a function body
     */
    private extractFunctionCalls;
    /**
     * Find security vulnerabilities using AST pattern matching
     */
    findSecurityPatterns(code: string): PythonSecurityPattern[];
}
//# sourceMappingURL=pythonAstAnalyzer.d.ts.map