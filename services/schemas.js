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
        // Handle pipe-separated categories (e.g., "Hardcoded Secret|API_KEY")
        const baseCategory = category.split('|')[0].trim();
        // Map various AI-generated categories to our standard ones
        const categoryMap = {
            'Hardcoded Secret': 'Hardcoded Secret',
            'Hardcoded Secrets': 'Hardcoded Secret',
            'Secret Exposure': 'Hardcoded Secret',
            'API_KEY': 'Hardcoded Secret',
            'Exposed Path': 'Exposed Path',
            'Path Exposure': 'Exposed Path',
            'Insecure Configuration': 'Insecure Configuration',
            'Configuration Issue': 'Insecure Configuration',
            'Insecure Password Storage': 'Insecure Configuration',
            'Insecure Cryptographic Operations': 'Vulnerable Pattern',
            'Cryptographic Vulnerability': 'Vulnerable Pattern',
            'Vulnerable Pattern': 'Vulnerable Pattern',
            'Vulnerability Pattern': 'Vulnerable Pattern',
            'SQL Injection': 'Vulnerable Pattern',
            'Threat Intel Match': 'Threat Intel Match',
            'Security Vulnerability': 'Vulnerable Pattern',
            'Information Disclosure': 'Exposed Path',
            'MEDIUM': 'Insecure Configuration',
            'HIGH': 'Vulnerable Pattern',
            'CRITICAL': 'Vulnerable Pattern'
        };
        // Return the mapped category or default to 'Vulnerable Pattern'
        return categoryMap[baseCategory] || categoryMap[category] || 'Vulnerable Pattern';
    }),
    description: z.string(),
    recommendation: z.string(),
    threatIntelMatch: z.string().nullable().optional().transform(val => val || undefined)
});
export const ReconResponseSchema = z.object({
    findings: z.array(ReconFindingSchema)
});
// API Security Schema - Flexible to handle various AI response formats
export const APIFindingSchema = z.object({
    id: z.union([z.number(), z.string()]).optional().transform(() => undefined),
    type: z.string().optional().transform(() => undefined),
    file: z.string().optional().transform(() => undefined),
    category: z.string().optional().transform(category => {
        if (!category)
            return 'Security Misconfiguration';
        // Map similar category names to our expected categories
        const categoryMap = {
            'vulnerability': 'Security Misconfiguration',
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
            'Unsafe Consumption': 'Unsafe Consumption',
            'Insecure direct object reference': 'BOLA',
            'Missing authentication': 'Broken Authentication',
            'Unvalidated user input': 'Security Misconfiguration'
        };
        // Return the mapped category or the original if no mapping exists
        return categoryMap[category] || 'Security Misconfiguration';
    }),
    description: z.string(),
    severity: z.string().transform(sev => {
        // Normalize severity to proper case (handle UPPERCASE and lowercase)
        const normalized = sev.toUpperCase();
        if (normalized === 'CRITICAL')
            return 'Critical';
        if (normalized === 'HIGH')
            return 'High';
        if (normalized === 'MEDIUM')
            return 'Medium';
        if (normalized === 'LOW')
            return 'Low';
        return 'Medium'; // Default fallback
    }),
    recommendation: z.string().optional().default('Review and fix the identified security issue.')
});
export const APIResponseSchema = z.object({
    findings: z.array(APIFindingSchema)
});
// Fuzz Target Schema - Enhanced with better language normalization
export const FuzzTargetSchema = z.object({
    functionName: z.string(),
    reasoning: z.string(),
    language: z.preprocess((val) => {
        if (typeof val !== 'string')
            return 'JavaScript';
        // Normalize language names
        const normalized = val.trim();
        const lowerNormalized = normalized.toLowerCase();
        // Handle various language name variations
        if (lowerNormalized === 'c/c++' || lowerNormalized === 'c++')
            return 'C++';
        if (lowerNormalized === 'c')
            return 'C';
        if (lowerNormalized === 'python' || lowerNormalized === 'py')
            return 'Python';
        if (lowerNormalized === 'javascript' || lowerNormalized === 'js')
            return 'JavaScript';
        if (lowerNormalized === 'typescript' || lowerNormalized === 'ts')
            return 'TypeScript';
        if (lowerNormalized === 'java')
            return 'Java';
        if (lowerNormalized === 'go' || lowerNormalized === 'golang')
            return 'Go';
        if (lowerNormalized === 'rust' || lowerNormalized === 'rs')
            return 'Rust';
        if (lowerNormalized === 'php')
            return 'PHP';
        // Default to JavaScript if unrecognized
        console.warn(`⚠️ Unrecognized language "${val}", defaulting to JavaScript`);
        return 'JavaScript';
    }, z.enum(['C', 'C++', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'PHP']))
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
    // Code files
    '.py', '.js', '.ts', '.jsx', '.tsx',
    '.java', '.cpp', '.c', '.cc', '.cxx',
    '.h', '.hpp', '.go', '.rs', '.php',
    '.rb', '.cs', '.swift', '.kt', '.scala',
    // Config and documentation
    '.json', '.yaml', '.yml', '.toml', '.xml',
    '.md', '.txt', '.env.example',
    // Web files
    '.html', '.css', '.scss', '.sass', '.less',
    '.svg', '.vue',
    // Build and config
    '.gitignore', '.dockerignore', '.editorconfig',
    'Dockerfile', 'Makefile', '.sh', '.bat', '.ps1',
    // Source maps and manifests
    '.map', 'manifest.json', 'package.json', 'package-lock.json',
    'composer.json', 'Gemfile', 'requirements.txt'
];
export function validateZipPath(path) {
    // Prevent path traversal attacks
    if (path.includes('..') || path.startsWith('/') || path.startsWith('\\')) {
        return false;
    }
    // Extract filename for special cases
    const fileName = path.split('/').pop() || path.split('\\').pop() || path;
    // Allow specific important files regardless of extension
    const importantFiles = [
        'Dockerfile', 'Makefile', 'README', 'LICENSE',
        'package.json', 'package-lock.json', 'composer.json',
        'requirements.txt', 'Gemfile', 'Gemfile.lock',
        'go.mod', 'go.sum', 'Cargo.toml', 'Cargo.lock',
        '.gitignore', '.dockerignore', '.env.example'
    ];
    if (importantFiles.some(name => fileName === name || fileName.startsWith(name))) {
        return true;
    }
    // Check for allowed extensions
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext));
    // Skip binary files (images, fonts, etc.) - these aren't dangerous but not useful for analysis
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
    const isBinary = binaryExtensions.some(ext => path.toLowerCase().endsWith(ext));
    return hasAllowedExtension && !isBinary;
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
export function detectPII(content) {
    const matches = [];
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
//# sourceMappingURL=schemas.js.map