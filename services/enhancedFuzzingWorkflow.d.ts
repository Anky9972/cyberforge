/**
 * ENHANCED FUZZING WORKFLOW
 * Integrates all new features:
 * - Python/Java AST Analysis
 * - Coverage-Guided Fuzzing
 * - Symbolic Execution
 * - Real CVE Database Integration
 */
import type { FuzzTarget, VulnerabilityReportData } from '../types';
export interface EnhancedFuzzingConfig {
    enableCoverageGuidedFuzzing: boolean;
    enableSymbolicExecution: boolean;
    enableCVEIntegration: boolean;
    maxFuzzingIterations: number;
    maxSymbolicPaths: number;
}
export interface EnhancedFuzzingResult {
    basicFuzzing?: any;
    coverageFuzzing?: any;
    symbolicExecution?: any;
    cveFindings?: Map<string, any>;
    enhancedReport: VulnerabilityReportData;
}
export declare class EnhancedFuzzingWorkflow {
    private astAnalyzer;
    private coverageFuzzer?;
    private symbolicExecutor?;
    private cveIntegration;
    private config;
    constructor(config?: Partial<EnhancedFuzzingConfig>);
    /**
     * Execute enhanced fuzzing workflow with all advanced features
     * NOW WITH TIMEOUT PROTECTION - Will never hang!
     */
    executeEnhancedFuzzing(codeFiles: Map<string, {
        code: string;
        language: string;
        filename: string;
    }>, fuzzTargets: FuzzTarget[]): Promise<EnhancedFuzzingResult>;
    /**
     * Internal execution method (without timeout wrapper)
     */
    private executeEnhancedFuzzingInternal;
    /**
     * Find the file containing a specific function
     */
    private findTargetFile;
    /**
     * Generate comprehensive vulnerability report from all analysis results
     */
    private generateEnhancedReport;
    /**
     * Extract CVE ID from findings or generate internal ID
     */
    private extractCVEId;
    /**
     * Generate comprehensive mitigation strategies based on all findings
     */
    private generateMitigationStrategies;
    /**
     * Generate comprehensive markdown report
     */
    generateFullReport(results: EnhancedFuzzingResult): string;
    /**
     * Generate fallback result when enhanced fuzzing times out or fails
     */
    private generateFallbackResult;
}
//# sourceMappingURL=enhancedFuzzingWorkflow.d.ts.map