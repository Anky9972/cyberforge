/**
 * AI-Powered Auto-Fix Generator Service
 * Uses Gemini API to generate automated vulnerability patches with tests
 */
interface Vulnerability {
    id: string;
    type: string;
    severity: string;
    description: string;
    codeSnippet: string;
    fileName: string;
    lineNumber: number;
    recommendation?: string;
}
interface AutoFixResult {
    originalCode: string;
    patchedCode: string;
    tests: string;
    explanation: string;
    confidence: number;
    changes: Array<{
        type: 'add' | 'remove' | 'modify';
        lineNumber: number;
        content: string;
    }>;
}
declare class AutoFixGeneratorService {
    private genAI;
    private model;
    constructor();
    /**
     * Initialize Gemini AI
     */
    private initialize;
    /**
     * Generate fix for a vulnerability
     */
    generateFix(vulnerability: Vulnerability, fullCode?: string): Promise<AutoFixResult>;
    /**
     * Build prompt for fix generation
     */
    private buildFixPrompt;
    /**
     * Parse AI response into structured result
     */
    private parseFixResponse;
    /**
     * Generate fallback fix (rule-based)
     */
    private generateFallbackFix;
    /**
     * Fix SQL Injection
     */
    private fixSQLInjection;
    /**
     * Fix XSS
     */
    private fixXSS;
    /**
     * Fix Command Injection
     */
    private fixCommandInjection;
    /**
     * Fix Path Traversal
     */
    private fixPathTraversal;
    /**
     * Add generic security
     */
    private addGenericSecurity;
    /**
     * Generate SQL Injection tests
     */
    private generateSQLInjectionTests;
    /**
     * Generate XSS tests
     */
    private generateXSSTests;
    /**
     * Generate Command Injection tests
     */
    private generateCommandInjectionTests;
    /**
     * Generate Path Traversal tests
     */
    private generatePathTraversalTests;
    /**
     * Batch generate fixes for multiple vulnerabilities
     */
    generateBatchFixes(vulnerabilities: Vulnerability[]): Promise<AutoFixResult[]>;
}
export declare const autoFixGeneratorService: AutoFixGeneratorService;
export default AutoFixGeneratorService;
//# sourceMappingURL=autoFixGeneratorService.d.ts.map