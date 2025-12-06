/**
 * SARIF Generator & GitHub Code Scanning Integration
 *
 * Features:
 * - Generate SARIF (Static Analysis Results Interchange Format) reports
 * - Upload to GitHub Code Scanning
 * - Inline PR comments with PoCs and CVSS scores
 * - GitHub App: "Fuzz this PR" check + status badge
 */
class SARIFGeneratorService {
    SARIF_VERSION = '2.1.0';
    SARIF_SCHEMA = 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json';
    /**
     * Create SARIF report from vulnerabilities
     */
    generateSARIFReport(vulnerabilities, projectInfo, stats) {
        // Generate rules from unique vulnerability types
        const rulesMap = new Map();
        const results = [];
        for (const vuln of vulnerabilities) {
            // Create rule if not exists
            if (!rulesMap.has(vuln.type)) {
                rulesMap.set(vuln.type, this.createRule(vuln));
            }
            // Create result
            const result = this.createResult(vuln);
            results.push(result);
        }
        const report = {
            version: this.SARIF_VERSION,
            $schema: this.SARIF_SCHEMA,
            runs: [
                {
                    tool: {
                        driver: {
                            name: projectInfo.name || 'FuzzForge',
                            version: projectInfo.version || '1.0.0',
                            informationUri: projectInfo.url || 'https://github.com/yourusername/fuzzforge',
                            rules: Array.from(rulesMap.values())
                        }
                    },
                    results
                }
            ]
        };
        // Add fuzzing stats if provided
        if (stats) {
            report.runs[0].properties = {
                fuzzingStats: stats
            };
        }
        return report;
    }
    /**
     * Create SARIF rule from vulnerability
     */
    createRule(vuln) {
        const severityScore = this.calculateSecuritySeverity(vuln.severity);
        return {
            id: vuln.type || 'FUZZ-001',
            name: vuln.title || vuln.type,
            shortDescription: {
                text: vuln.description?.substring(0, 200) || 'Security vulnerability detected'
            },
            fullDescription: {
                text: vuln.description || vuln.details || 'No description available'
            },
            helpUri: vuln.helpUrl || 'https://fuzzforge.dev/docs/vulnerabilities',
            properties: {
                tags: this.extractTags(vuln),
                precision: vuln.confidence >= 0.9 ? 'high' : vuln.confidence >= 0.7 ? 'medium' : 'low',
                'security-severity': severityScore.toString()
            }
        };
    }
    /**
     * Create SARIF result from vulnerability
     */
    createResult(vuln) {
        const level = this.mapSeverityToLevel(vuln.severity);
        const result = {
            ruleId: vuln.type || 'FUZZ-001',
            level,
            message: {
                text: vuln.message || vuln.description || 'Vulnerability detected'
            },
            locations: this.createLocations(vuln),
            partialFingerprints: {
                primaryLocationLineHash: this.generateFingerprint(vuln)
            },
            properties: {
                cvss: vuln.cvss || this.calculateCVSS(vuln),
                cwe: vuln.cwe ? [vuln.cwe] : [],
                attackTags: vuln.attackTags || this.inferAttackTags(vuln),
                exploitability: vuln.exploitability || this.calculateExploitability(vuln),
                poc: vuln.poc || vuln.input || ''
            }
        };
        return result;
    }
    /**
     * Create locations array
     */
    createLocations(vuln) {
        if (!vuln.location) {
            return [];
        }
        const location = {
            physicalLocation: {
                artifactLocation: {
                    uri: vuln.location.file || 'unknown',
                    uriBaseId: '%SRCROOT%'
                },
                region: {
                    startLine: vuln.location.line || 1,
                    endLine: vuln.location.endLine || vuln.location.line || 1,
                    startColumn: vuln.location.column || 1,
                    endColumn: vuln.location.endColumn || vuln.location.column,
                    snippet: vuln.location.snippet ? {
                        text: vuln.location.snippet
                    } : undefined
                }
            }
        };
        return [location];
    }
    /**
     * Map severity to SARIF level
     */
    mapSeverityToLevel(severity) {
        const sev = severity?.toLowerCase() || '';
        if (sev.includes('critical') || sev.includes('high')) {
            return 'error';
        }
        else if (sev.includes('medium')) {
            return 'warning';
        }
        return 'note';
    }
    /**
     * Calculate security severity score (0-10)
     */
    calculateSecuritySeverity(severity) {
        const sev = severity?.toLowerCase() || '';
        if (sev.includes('critical'))
            return 10.0;
        if (sev.includes('high'))
            return 8.0;
        if (sev.includes('medium'))
            return 5.0;
        if (sev.includes('low'))
            return 2.0;
        return 0.0;
    }
    /**
     * Calculate CVSS score
     */
    calculateCVSS(vuln) {
        let score = 5.0; // Base score
        // Increase for high severity
        if (vuln.severity?.toLowerCase().includes('critical'))
            score += 4.0;
        else if (vuln.severity?.toLowerCase().includes('high'))
            score += 2.0;
        // Increase for remote exploitability
        if (vuln.type?.toLowerCase().includes('injection') ||
            vuln.type?.toLowerCase().includes('deserialize')) {
            score += 1.5;
        }
        // Increase for auth bypass
        if (vuln.type?.toLowerCase().includes('auth') ||
            vuln.type?.toLowerCase().includes('permission')) {
            score += 1.0;
        }
        return Math.min(10.0, score);
    }
    /**
     * Calculate exploitability score (0-100)
     */
    calculateExploitability(vuln) {
        let score = 50; // Base
        // Has PoC?
        if (vuln.poc || vuln.input)
            score += 30;
        // Easy to trigger?
        if (vuln.complexity === 'low')
            score += 10;
        // Remote?
        if (vuln.vector === 'network')
            score += 10;
        return Math.min(100, score);
    }
    /**
     * Extract tags from vulnerability
     */
    extractTags(vuln) {
        const tags = ['security', 'fuzzing'];
        if (vuln.type) {
            tags.push(vuln.type.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        }
        if (vuln.cwe) {
            tags.push(`cwe-${vuln.cwe}`);
        }
        return tags;
    }
    /**
     * Infer MITRE ATT&CK tags
     */
    inferAttackTags(vuln) {
        const tags = [];
        const type = vuln.type?.toLowerCase() || '';
        if (type.includes('injection') || type.includes('xss')) {
            tags.push('T1059'); // Command and Scripting Interpreter
        }
        if (type.includes('auth') || type.includes('session')) {
            tags.push('T1078'); // Valid Accounts
        }
        if (type.includes('deserialize')) {
            tags.push('T1203'); // Exploitation for Client Execution
        }
        if (type.includes('path traversal') || type.includes('file')) {
            tags.push('T1083'); // File and Directory Discovery
        }
        return tags;
    }
    /**
     * Generate fingerprint for deduplication
     */
    generateFingerprint(vuln) {
        const crypto = require('crypto');
        const str = `${vuln.type}-${vuln.location?.file}-${vuln.location?.line}`;
        return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
    }
    /**
     * Generate GitHub PR comment from vulnerability
     */
    generatePRComment(vuln) {
        const emoji = this.getSeverityEmoji(vuln.severity);
        let comment = `${emoji} **${vuln.title || vuln.type}** (${vuln.severity})\n\n`;
        comment += `**Description:**\n${vuln.description || 'No description'}\n\n`;
        if (vuln.cvss) {
            comment += `**CVSS Score:** ${vuln.cvss}\n\n`;
        }
        if (vuln.cwe) {
            comment += `**CWE:** [CWE-${vuln.cwe}](https://cwe.mitre.org/data/definitions/${vuln.cwe}.html)\n\n`;
        }
        if (vuln.poc) {
            comment += `**Proof of Concept:**\n\`\`\`\n${vuln.poc}\n\`\`\`\n\n`;
        }
        if (vuln.recommendation) {
            comment += `**Recommendation:**\n${vuln.recommendation}\n\n`;
        }
        comment += `---\n*Found by FuzzForge 🔍*`;
        return comment;
    }
    /**
     * Get emoji for severity
     */
    getSeverityEmoji(severity) {
        const sev = severity?.toLowerCase() || '';
        if (sev.includes('critical'))
            return '🔴';
        if (sev.includes('high'))
            return '🟠';
        if (sev.includes('medium'))
            return '🟡';
        return '🔵';
    }
    /**
     * Generate GitHub Actions workflow for fuzzing
     */
    generateGitHubActionsWorkflow() {
        return `name: FuzzForge Security Analysis

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  fuzz:
    name: Security Fuzzing
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      security-events: write
      pull-requests: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install FuzzForge
        run: npm install -g fuzzforge
      
      - name: Run Fuzzing
        run: |
          fuzzforge analyze --target . --output results.sarif
        continue-on-error: true
      
      - name: Upload SARIF to GitHub
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const sarif = JSON.parse(fs.readFileSync('results.sarif', 'utf8'));
            const results = sarif.runs[0].results;
            
            if (results.length > 0) {
              const comment = \`## 🔍 FuzzForge Security Analysis\\n\\n\`;
              // Add formatted results
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: comment
              });
            }
`;
    }
    /**
     * Export SARIF to file
     */
    exportToFile(report) {
        return JSON.stringify(report, null, 2);
    }
}
// Singleton instance
export const sarifGenerator = new SARIFGeneratorService();
//# sourceMappingURL=sarifGenerator.js.map