/**
 * SARIF Generator & GitHub Code Scanning Integration
 *
 * Features:
 * - Generate SARIF (Static Analysis Results Interchange Format) reports
 * - Upload to GitHub Code Scanning
 * - Inline PR comments with PoCs and CVSS scores
 * - GitHub App: "Fuzz this PR" check + status badge
 */
export interface SARIFLocation {
    physicalLocation: {
        artifactLocation: {
            uri: string;
            uriBaseId?: string;
        };
        region: {
            startLine: number;
            endLine?: number;
            startColumn?: number;
            endColumn?: number;
            snippet?: {
                text: string;
            };
        };
    };
}
export interface SARIFResult {
    ruleId: string;
    level: 'error' | 'warning' | 'note';
    message: {
        text: string;
    };
    locations: SARIFLocation[];
    partialFingerprints?: {
        primaryLocationLineHash?: string;
    };
    properties?: {
        cvss?: number;
        cwe?: string[];
        attackTags?: string[];
        exploitability?: number;
        poc?: string;
    };
}
export interface SARIFRule {
    id: string;
    name: string;
    shortDescription: {
        text: string;
    };
    fullDescription: {
        text: string;
    };
    helpUri?: string;
    properties?: {
        tags?: string[];
        precision?: string;
        'security-severity'?: string;
    };
}
export interface SARIFReport {
    version: '2.1.0';
    $schema: string;
    runs: Array<{
        tool: {
            driver: {
                name: string;
                version: string;
                informationUri: string;
                rules: SARIFRule[];
            };
        };
        results: SARIFResult[];
        properties?: {
            fuzzingStats?: {
                executions: number;
                crashes: number;
                coverage: number;
                duration: number;
            };
        };
    }>;
}
declare class SARIFGeneratorService {
    private readonly SARIF_VERSION;
    private readonly SARIF_SCHEMA;
    /**
     * Create SARIF report from vulnerabilities
     */
    generateSARIFReport(vulnerabilities: any[], projectInfo: {
        name: string;
        version: string;
        url?: string;
    }, stats?: {
        executions: number;
        crashes: number;
        coverage: number;
        duration: number;
    }): SARIFReport;
    /**
     * Create SARIF rule from vulnerability
     */
    private createRule;
    /**
     * Create SARIF result from vulnerability
     */
    private createResult;
    /**
     * Create locations array
     */
    private createLocations;
    /**
     * Map severity to SARIF level
     */
    private mapSeverityToLevel;
    /**
     * Calculate security severity score (0-10)
     */
    private calculateSecuritySeverity;
    /**
     * Calculate CVSS score
     */
    private calculateCVSS;
    /**
     * Calculate exploitability score (0-100)
     */
    private calculateExploitability;
    /**
     * Extract tags from vulnerability
     */
    private extractTags;
    /**
     * Infer MITRE ATT&CK tags
     */
    private inferAttackTags;
    /**
     * Generate fingerprint for deduplication
     */
    private generateFingerprint;
    /**
     * Generate GitHub PR comment from vulnerability
     */
    generatePRComment(vuln: any): string;
    /**
     * Get emoji for severity
     */
    private getSeverityEmoji;
    /**
     * Generate GitHub Actions workflow for fuzzing
     */
    generateGitHubActionsWorkflow(): string;
    /**
     * Export SARIF to file
     */
    exportToFile(report: SARIFReport): string;
}
export declare const sarifGenerator: SARIFGeneratorService;
export {};
//# sourceMappingURL=sarifGenerator.d.ts.map