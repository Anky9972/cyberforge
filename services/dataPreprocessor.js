// Data preprocessing utility for AI responses
export function preprocessReconFindings(findings) {
    if (!Array.isArray(findings))
        return [];
    return findings.map(finding => {
        // Map invalid categories to valid ones
        const categoryMap = {
            'Insecure Password Storage': 'Insecure Configuration',
            'Insecure Cryptographic Operations': 'Vulnerable Pattern',
            'Cryptographic Vulnerability': 'Vulnerable Pattern',
            'Security Vulnerability': 'Vulnerable Pattern',
            'Information Disclosure': 'Exposed Path',
            'Hardcoded Secrets': 'Hardcoded Secret',
            'Secret Exposure': 'Hardcoded Secret',
            'Path Exposure': 'Exposed Path',
            'Configuration Issue': 'Insecure Configuration'
        };
        return {
            category: categoryMap[finding.category] || finding.category || 'Vulnerable Pattern',
            description: finding.description || 'Unknown security issue detected',
            recommendation: finding.recommendation || 'Review and remediate this finding',
            threatIntelMatch: finding.threatIntelMatch === null ? undefined : finding.threatIntelMatch
        };
    });
}
export function preprocessAPIFindings(findings) {
    if (!Array.isArray(findings))
        return [];
    return findings.map(finding => ({
        category: finding.category || 'Security Misconfiguration',
        description: finding.description || 'Unknown API security issue detected',
        severity: finding.severity || 'Medium',
        recommendation: finding.recommendation || 'Review and remediate this API security finding'
    }));
}
//# sourceMappingURL=dataPreprocessor.js.map