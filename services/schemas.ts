// Zod schemas for validating AI responses
import { z } from 'zod';

// CKG Schema
export const CKGNodeSchema = z.object({
    id: z.string(),
    label: z.string(),
    type: z.enum(['Function', 'Class', 'File', 'Dependency', 'Endpoint'])
});

export const CKGEdgeSchema = z.object({
    source: z.string(),
    target: z.string()
});

export const CKGDataSchema = z.object({
    summary: z.string(),
    nodes: z.array(CKGNodeSchema),
    edges: z.array(CKGEdgeSchema)
});

// Reconnaissance Schema - More flexible to handle AI variations
export const ReconFindingSchema = z.object({
    category: z.string().transform(category => {
        // Map various AI-generated categories to our standard ones
        const categoryMap: Record<string, string> = {
            'Hardcoded Secret': 'Hardcoded Secret',
            'Hardcoded Secrets': 'Hardcoded Secret',
            'Secret Exposure': 'Hardcoded Secret',
            'Exposed Path': 'Exposed Path',
            'Path Exposure': 'Exposed Path',
            'Insecure Configuration': 'Insecure Configuration',
            'Configuration Issue': 'Insecure Configuration',
            'Insecure Password Storage': 'Insecure Configuration',
            'Insecure Cryptographic Operations': 'Vulnerable Pattern',
            'Cryptographic Vulnerability': 'Vulnerable Pattern',
            'Vulnerable Pattern': 'Vulnerable Pattern',
            'Vulnerability Pattern': 'Vulnerable Pattern',
            'Threat Intel Match': 'Threat Intel Match',
            'Security Vulnerability': 'Vulnerable Pattern',
            'Information Disclosure': 'Exposed Path'
        };
        
        // Return the mapped category or default to 'Vulnerable Pattern'
        return categoryMap[category] || 'Vulnerable Pattern';
    }),
    description: z.string(),
    recommendation: z.string(),
    threatIntelMatch: z.string().nullable().optional().transform(val => val || undefined)
});

export const ReconResponseSchema = z.object({
    findings: z.array(ReconFindingSchema)
});

// API Security Schema
export const APIFindingSchema = z.object({
    category: z.string().transform(category => {
        // Map similar category names to our expected categories
        const categoryMap: Record<string, string> = {
            'Unrestricted Resource Consumption': 'Resource Consumption',
            'Improper Inventory Management': 'Inventory Management',
            'Security Misconfiguration': 'Security Misconfiguration',
            'BOLA': 'BOLA',
            'Broken Authentication': 'Broken Authentication',
            'Broken Object Property': 'Broken Object Property',
            'Resource Consumption': 'Resource Consumption',
            'Broken Function Level': 'Broken Function Level',
            'Business Flow': 'Business Flow',
            'SSRF': 'SSRF',
            'Inventory Management': 'Inventory Management',
            'Unsafe Consumption': 'Unsafe Consumption'
        };
        
        // Return the mapped category or the original if no mapping exists
        return categoryMap[category] || 'Security Misconfiguration';
    }),
    description: z.string(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
    recommendation: z.string()
});

export const APIResponseSchema = z.object({
    findings: z.array(APIFindingSchema)
});

// Fuzz Target Schema
export const FuzzTargetSchema = z.object({
    functionName: z.string(),
    reasoning: z.string(),
    language: z.enum(['C', 'C++', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'PHP'])
});

export const FuzzTargetResponseSchema = z.object({
    targets: z.array(FuzzTargetSchema)
});

// Vulnerability Report Schema
export const VulnerabilityReportSchema = z.object({
    vulnerabilityTitle: z.string(),
    cveId: z.string(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low', 'Informational']),
    description: z.string(),
    vulnerableCode: z.string(),
    language: z.string(),
    mitigation: z.string()
});

// ZIP File Validation Schema
export const ZIP_MAX_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_EXTENSIONS = [
    '.py', '.js', '.ts', '.jsx', '.tsx',
    '.java', '.cpp', '.c', '.cc', '.cxx',
    '.h', '.hpp', '.go', '.rs', '.php',
    '.rb', '.cs', '.swift', '.kt', '.scala'
];

export function validateZipPath(path: string): boolean {
    // Prevent path traversal attacks
    if (path.includes('..') || path.startsWith('/') || path.startsWith('\\')) {
        return false;
    }
    
    // Check for allowed extensions
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => 
        path.toLowerCase().endsWith(ext)
    );
    
    return hasAllowedExtension;
}

// PII Detection Patterns
export const PII_PATTERNS = [
    { name: 'Email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
    { name: 'API Key', pattern: /['"][A-Za-z0-9_-]{32,}['"]/g },
    { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/g },
    { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { name: 'Credit Card', pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
    { name: 'JWT', pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g }
];

export function detectPII(content: string): { found: boolean; matches: string[] } {
    const matches: string[] = [];
    
    PII_PATTERNS.forEach(({ name, pattern }) => {
        const foundMatches = content.match(pattern);
        if (foundMatches) {
            matches.push(`${name}: ${foundMatches.length} occurrence(s)`);
        }
    });
    
    return {
        found: matches.length > 0,
        matches
    };
}
