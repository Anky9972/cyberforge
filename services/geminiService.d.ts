import type { VulnerabilityReportData, FuzzTarget, ReconFinding, CKGData, APIFinding } from '../types';
export declare function generateCKG(codebaseSummary: string): Promise<CKGData>;
/**
 * NEW: AST-Enhanced CKG Generation
 * Uses real Abstract Syntax Tree parsing instead of LLM guessing
 * Falls back to LLM if AST parsing fails
 */
export declare function generateCKGWithAST(codebaseSummary: string, codeFiles: Map<string, {
    code: string;
    language: string;
    filename: string;
}>): Promise<CKGData>;
export declare function performReconnaissanceAnalysis(codebaseSummary: string): Promise<ReconFinding[]>;
export declare function performAPISecurityAnalysis(codebaseSummary: string): Promise<APIFinding[]>;
export declare function identifyFuzzTargets(ckgSummary: string): Promise<FuzzTarget[]>;
export declare function generatePromptFuzzInputs(fuzzTargets: FuzzTarget[]): Promise<string>;
export declare function simulateFuzzingAndGenerateReport(ckgSummary: string, reconFindings: ReconFinding[], apiFindings: APIFinding[], fuzzTargets: FuzzTarget[], fuzzInputs: string): Promise<VulnerabilityReportData>;
/**
 * PHASE 3: REAL FUZZING ENGINE INTEGRATION
 * Execute actual fuzz tests with mutation-based input generation
 * NOT LLM simulation - this runs real code!
 */
export declare function executeRealFuzzingAndGenerateReport(codeFiles: Map<string, {
    code: string;
    language: string;
    filename: string;
}>, ckgSummary: string, reconFindings: ReconFinding[], apiFindings: APIFinding[], fuzzTargets: FuzzTarget[]): Promise<VulnerabilityReportData>;
//# sourceMappingURL=geminiService.d.ts.map