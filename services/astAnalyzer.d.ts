import type { CKGData } from '../types';
interface SecurityPattern {
    type: string;
    line: number;
    code: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    confidence: number;
    description: string;
}
export declare class ASTAnalyzer {
    private pythonAnalyzer?;
    private javaAnalyzer?;
    constructor();
    /**
     * Analyze code with language detection and proper AST parser
     */
    analyzeCode(code: string, filename: string, language: string): CKGData;
    /**
     * Fallback analysis using regex when AST parsers are unavailable
     */
    private fallbackAnalysis;
    private getClassName;
    private getCalleeName;
    private getFunctionName;
    /**
     * Analyze JavaScript/TypeScript code using Babel parser
     * Extracts real code structure, not LLM guesses
     */
    analyzeJavaScriptCode(code: string, filename: string): CKGData;
    /**
     * Analyze Python code structure
     * Note: For full Python support, install tree-sitter-python
     * This is a simplified version using regex patterns
     */
    /**
     * DEPRECATED: Use pythonAnalyzer.analyzePythonCode() instead
     * Kept for backward compatibility
     */
    analyzePythonCode(code: string, filename: string): CKGData;
    /**
     * Detect security patterns using AST analysis
     * This is MUCH more accurate than LLM pattern guessing
     */
    findSecurityPatterns(code: string, language: string): SecurityPattern[];
    private findJavaScriptSecurityPatterns;
    private findPythonSecurityPatterns;
}
export type { SecurityPattern };
//# sourceMappingURL=astAnalyzer.d.ts.map