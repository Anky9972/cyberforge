/**
 * REAL CVE DATABASE INTEGRATION
 * Integrates with NVD (National Vulnerability Database) API
 * Replaces hardcoded mock threat intelligence feed
 */
export interface CVEDetails {
    cveId: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    cvssScore: number;
    publishedDate: string;
    references: string[];
    affectedComponents: string[];
}
export interface CVESearchResult {
    found: boolean;
    cves: CVEDetails[];
    confidence: number;
}
export declare class CVEDatabaseIntegration {
    private readonly NVD_API_URL;
    private readonly GHSA_API_URL;
    private cache;
    /**
     * Search for CVEs matching code patterns or dependency names
     */
    searchCVEs(query: string, context?: string): Promise<CVESearchResult>;
    /**
     * Search National Vulnerability Database
     */
    private searchNVD;
    /**
     * Search GitHub Security Advisories
     */
    private searchGHSA;
    /**
     * Extract affected components from NVD CVE data
     */
    private extractAffectedComponents;
    /**
     * Fallback: Local pattern matching when API is unavailable
     * Enhanced version of the original mock threat intel feed
     */
    private localCVEPatternMatching;
    /**
     * Check specific dependencies against known CVEs
     */
    checkDependencies(dependencies: Array<{
        name: string;
        version: string;
    }>): Promise<Map<string, CVESearchResult>>;
    /**
     * Generate CVE report for display
     */
    generateCVEReport(results: CVESearchResult): string;
}
//# sourceMappingURL=cveIntegration.d.ts.map