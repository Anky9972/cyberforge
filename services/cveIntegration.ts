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

export class CVEDatabaseIntegration {
    private readonly NVD_API_URL = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
    private readonly GHSA_API_URL = 'https://api.github.com/advisories';
    private cache: Map<string, CVESearchResult> = new Map();

    /**
     * Search for CVEs matching code patterns or dependency names
     */
    async searchCVEs(query: string, context?: string): Promise<CVESearchResult> {
        console.log(`🔍 Searching CVE database for: ${query}`);

        // Check cache first
        const cacheKey = `${query}_${context || ''}`;
        if (this.cache.has(cacheKey)) {
            console.log('✅ Found in cache');
            return this.cache.get(cacheKey)!;
        }

        try {
            // Try NVD API first
            const nvdResults = await this.searchNVD(query);
            
            // Fallback to GitHub Security Advisories
            if (nvdResults.cves.length === 0) {
                const ghsaResults = await this.searchGHSA(query);
                return ghsaResults;
            }

            this.cache.set(cacheKey, nvdResults);
            return nvdResults;

        } catch (error) {
            console.error('CVE search failed:', error);
            
            // Ultimate fallback: use local CVE pattern matching
            return this.localCVEPatternMatching(query, context);
        }
    }

    /**
     * Search National Vulnerability Database
     */
    private async searchNVD(query: string): Promise<CVESearchResult> {
        try {
            const url = `${this.NVD_API_URL}?keywordSearch=${encodeURIComponent(query)}`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`NVD API returned ${response.status}`);
            }

            const data = await response.json();
            const cves: CVEDetails[] = [];

            if (data.vulnerabilities && Array.isArray(data.vulnerabilities)) {
                for (const vuln of data.vulnerabilities.slice(0, 10)) {
                    const cve = vuln.cve;
                    
                    const cvssData = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV2?.[0];
                    const severity = cvssData?.cvssData?.baseSeverity || 'MEDIUM';
                    const score = cvssData?.cvssData?.baseScore || 5.0;

                    cves.push({
                        cveId: cve.id,
                        description: cve.descriptions?.[0]?.value || 'No description available',
                        severity: severity.toUpperCase() as any,
                        cvssScore: score,
                        publishedDate: cve.published,
                        references: cve.references?.slice(0, 3).map((ref: any) => ref.url) || [],
                        affectedComponents: this.extractAffectedComponents(cve)
                    });
                }
            }

            return {
                found: cves.length > 0,
                cves,
                confidence: 0.95
            };

        } catch (error) {
            console.error('NVD search error:', error);
            throw error;
        }
    }

    /**
     * Search GitHub Security Advisories
     */
    private async searchGHSA(query: string): Promise<CVESearchResult> {
        try {
            const url = `${this.GHSA_API_URL}?query=${encodeURIComponent(query)}`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API returned ${response.status}`);
            }

            const advisories = await response.json();
            const cves: CVEDetails[] = [];

            if (Array.isArray(advisories)) {
                for (const advisory of advisories.slice(0, 10)) {
                    cves.push({
                        cveId: advisory.cve_id || advisory.ghsa_id,
                        description: advisory.summary || 'No description available',
                        severity: advisory.severity?.toUpperCase() || 'MEDIUM',
                        cvssScore: advisory.cvss?.score || 5.0,
                        publishedDate: advisory.published_at,
                        references: [advisory.html_url],
                        affectedComponents: advisory.vulnerabilities?.map((v: any) => 
                            `${v.package.ecosystem}:${v.package.name}`
                        ) || []
                    });
                }
            }

            return {
                found: cves.length > 0,
                cves,
                confidence: 0.9
            };

        } catch (error) {
            console.error('GHSA search error:', error);
            throw error;
        }
    }

    /**
     * Extract affected components from NVD CVE data
     */
    private extractAffectedComponents(cve: any): string[] {
        const components: string[] = [];

        if (cve.configurations && Array.isArray(cve.configurations)) {
            for (const config of cve.configurations) {
                if (config.nodes && Array.isArray(config.nodes)) {
                    for (const node of config.nodes) {
                        if (node.cpeMatch && Array.isArray(node.cpeMatch)) {
                            for (const match of node.cpeMatch) {
                                if (match.criteria) {
                                    // Extract vendor:product from CPE
                                    const parts = match.criteria.split(':');
                                    if (parts.length >= 5) {
                                        components.push(`${parts[3]}:${parts[4]}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return Array.from(new Set(components));
    }

    /**
     * Fallback: Local pattern matching when API is unavailable
     * Enhanced version of the original mock threat intel feed
     */
    private localCVEPatternMatching(query: string, context?: string): CVESearchResult {
        console.log('⚠️ Using local CVE pattern matching (API unavailable)');

        const patterns: { pattern: RegExp; cves: CVEDetails[] }[] = [
            {
                pattern: /log4j/i,
                cves: [{
                    cveId: 'CVE-2021-44228',
                    description: 'Apache Log4j2 2.0-beta9 through 2.15.0 JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints',
                    severity: 'CRITICAL',
                    cvssScore: 10.0,
                    publishedDate: '2021-12-10',
                    references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-44228'],
                    affectedComponents: ['apache:log4j']
                }]
            },
            {
                pattern: /jackson.*databind/i,
                cves: [{
                    cveId: 'CVE-2020-36518',
                    description: 'Jackson-databind before 2.13.0 allows a Java StackOverflow exception and denial of service via a large depth of nested objects',
                    severity: 'HIGH',
                    cvssScore: 7.5,
                    publishedDate: '2022-03-11',
                    references: ['https://nvd.nist.gov/vuln/detail/CVE-2020-36518'],
                    affectedComponents: ['fasterxml:jackson-databind']
                }]
            },
            {
                pattern: /spring.*core|springframework/i,
                cves: [{
                    cveId: 'CVE-2022-22965',
                    description: 'Spring Framework RCE via Data Binding on JDK 9+ (Spring4Shell)',
                    severity: 'CRITICAL',
                    cvssScore: 9.8,
                    publishedDate: '2022-04-01',
                    references: ['https://nvd.nist.gov/vuln/detail/CVE-2022-22965'],
                    affectedComponents: ['spring:spring-framework']
                }]
            },
            {
                pattern: /struts/i,
                cves: [{
                    cveId: 'CVE-2017-5638',
                    description: 'Apache Struts 2.3.5 - 2.3.31, 2.5 - 2.5.10 Remote Code Execution via Content-Type header',
                    severity: 'CRITICAL',
                    cvssScore: 10.0,
                    publishedDate: '2017-03-11',
                    references: ['https://nvd.nist.gov/vuln/detail/CVE-2017-5638'],
                    affectedComponents: ['apache:struts']
                }]
            },
            {
                pattern: /exec(ute)?\(|eval|innerHTML|document\.write/i,
                cves: [{
                    cveId: 'CWE-79',
                    description: 'Improper Neutralization of Input During Web Page Generation (Cross-site Scripting)',
                    severity: 'MEDIUM',
                    cvssScore: 6.1,
                    publishedDate: '2006-07-19',
                    references: ['https://cwe.mitre.org/data/definitions/79.html'],
                    affectedComponents: ['general:javascript']
                }]
            },
            {
                pattern: /SELECT.*FROM.*WHERE.*=.*'|executeQuery|execute\(/i,
                cves: [{
                    cveId: 'CWE-89',
                    description: 'Improper Neutralization of Special Elements used in an SQL Command (SQL Injection)',
                    severity: 'CRITICAL',
                    cvssScore: 9.8,
                    publishedDate: '2006-07-19',
                    references: ['https://cwe.mitre.org/data/definitions/89.html'],
                    affectedComponents: ['general:sql']
                }]
            },
            {
                pattern: /system\(|popen\(|shell_exec\(|Runtime\.exec/i,
                cves: [{
                    cveId: 'CWE-78',
                    description: 'Improper Neutralization of Special Elements used in an OS Command (Command Injection)',
                    severity: 'CRITICAL',
                    cvssScore: 9.8,
                    publishedDate: '2006-07-19',
                    references: ['https://cwe.mitre.org/data/definitions/78.html'],
                    affectedComponents: ['general:os-command']
                }]
            },
            {
                pattern: /pickle\.loads?|unserialize|readObject/i,
                cves: [{
                    cveId: 'CWE-502',
                    description: 'Deserialization of Untrusted Data',
                    severity: 'HIGH',
                    cvssScore: 8.1,
                    publishedDate: '2006-07-19',
                    references: ['https://cwe.mitre.org/data/definitions/502.html'],
                    affectedComponents: ['general:deserialization']
                }]
            }
        ];

        const matchedCVEs: CVEDetails[] = [];
        const searchText = `${query} ${context || ''}`;

        for (const { pattern, cves } of patterns) {
            if (pattern.test(searchText)) {
                matchedCVEs.push(...cves);
            }
        }

        return {
            found: matchedCVEs.length > 0,
            cves: matchedCVEs,
            confidence: 0.7  // Lower confidence for local matching
        };
    }

    /**
     * Check specific dependencies against known CVEs
     */
    async checkDependencies(dependencies: Array<{ name: string; version: string }>): Promise<Map<string, CVESearchResult>> {
        const results = new Map<string, CVESearchResult>();

        for (const dep of dependencies) {
            const query = `${dep.name} ${dep.version}`;
            const result = await this.searchCVEs(query, `dependency:${dep.name}`);
            
            if (result.found) {
                results.set(dep.name, result);
                console.log(`⚠️ Found ${result.cves.length} CVE(s) for ${dep.name}@${dep.version}`);
            }
        }

        return results;
    }

    /**
     * Generate CVE report for display
     */
    generateCVEReport(results: CVESearchResult): string {
        if (!results.found) {
            return '✅ No known CVEs found';
        }

        return `
🔴 **${results.cves.length} CVE(s) Found** (Confidence: ${(results.confidence * 100).toFixed(0)}%)

${results.cves.map(cve => `
### ${cve.cveId} - ${cve.severity}
**CVSS Score:** ${cve.cvssScore.toFixed(1)}/10.0
**Published:** ${new Date(cve.publishedDate).toLocaleDateString()}
**Description:** ${cve.description}
**Affected:** ${cve.affectedComponents.join(', ') || 'N/A'}
**References:** ${cve.references[0] || 'N/A'}
`).join('\n---\n')}
        `.trim();
    }
}
