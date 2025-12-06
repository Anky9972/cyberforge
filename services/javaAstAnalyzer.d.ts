/**
 * REAL Java AST Analysis using java-parser
 * Handles Java codebases with actual syntax tree parsing
 */
import type { CKGData } from '../types';
export interface JavaSecurityPattern {
    type: string;
    line: number;
    code: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    confidence: number;
    description: string;
}
export declare class JavaASTAnalyzer {
    /**
     * Parse Java code into AST and extract Code Knowledge Graph
     */
    analyzeJavaCode(code: string, filename: string): CKGData;
    /**
     * Extract class information from AST
     */
    private extractClassInfo;
    /**
     * Extract method information from AST
     */
    private extractMethodInfo;
    /**
     * Extract method parameters
     */
    private extractMethodParameters;
    /**
     * Extract method calls from method body
     */
    private extractMethodCalls;
    /**
     * Fallback regex-based analysis when AST parsing fails
     */
    private fallbackJavaAnalysis;
    /**
     * Find security vulnerabilities using pattern matching
     */
    findSecurityPatterns(code: string): JavaSecurityPattern[];
}
//# sourceMappingURL=javaAstAnalyzer.d.ts.map