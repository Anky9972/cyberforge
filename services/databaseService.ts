/**
 * Database Service - Bridge between frontend fuzzing workflow and backend database
 * Saves analysis results to PostgreSQL via backend API
 */

import type { 
    VulnerabilityReportData, 
    ReconFinding, 
    APIFinding, 
    FuzzTarget,
    CKGData 
} from '../types';

const API_BASE_URL = (typeof process !== 'undefined' && process.env?.VITE_API_URL) || 'http://localhost:3002';

interface CreateProjectRequest {
    name: string;
    description?: string;
    language?: string;
    framework?: string;
}

interface CreateScanRequest {
    projectId: string;
    scanType: 'FULL' | 'QUICK' | 'INCREMENTAL' | 'TARGETED';
    filesScanned: number;
    linesOfCode: number;
}

interface SaveAnalysisResultsRequest {
    projectId: string;
    scanId: string;
    reconFindings: ReconFinding[];
    apiFindings: APIFinding[];
    vulnerabilityReport: VulnerabilityReportData;
    fuzzTargets: FuzzTarget[];
    ckgData: CKGData;
    duration: number;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
    try {
        const authData = (typeof global !== 'undefined' && (global as any).localStorage) ? (global as any).localStorage.getItem('auth') : null;
        if (authData) {
            const parsed = JSON.parse(authData);
            return parsed.token || null;
        }
    } catch (error) {
        console.error('Failed to get auth token:', error);
    }
    return null;
}

/**
 * Create a new project for the codebase being analyzed
 */
export async function createProject(fileName: string, language?: string): Promise<string> {
    const token = getAuthToken();
    
    if (!token) {
        console.warn('⚠️ No auth token - skipping database save');
        return 'local-project-' + Date.now();
    }

    try {
        const projectData: CreateProjectRequest = {
            name: fileName.replace(/\.(zip|tar\.gz)$/, ''),
            description: `Security analysis of ${fileName}`,
            language: language || 'Unknown',
        };

        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(projectData),
        });

        if (!response.ok) {
            throw new Error(`Failed to create project: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Project created in database:', (data as any).project.id);
        return (data as any).project.id;
    } catch (error) {
        console.error('❌ Failed to create project:', error);
        return 'local-project-' + Date.now();
    }
}

/**
 * Create a new scan record
 */
export async function createScan(
    projectId: string, 
    filesScanned: number, 
    linesOfCode: number
): Promise<string> {
    const token = getAuthToken();
    
    if (!token || projectId.startsWith('local-')) {
        console.warn('⚠️ No auth token or local project - skipping scan creation');
        return 'local-scan-' + Date.now();
    }

    try {
        const scanData: CreateScanRequest = {
            projectId,
            scanType: 'FULL',
            filesScanned,
            linesOfCode,
        };

        const response = await fetch(`${API_BASE_URL}/api/scans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(scanData),
        });

        if (!response.ok) {
            throw new Error(`Failed to create scan: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Scan created in database:', (data as any).scan.id);
        return (data as any).scan.id;
    } catch (error) {
        console.error('❌ Failed to create scan:', error);
        return 'local-scan-' + Date.now();
    }
}

/**
 * Save complete analysis results to database
 */
export async function saveAnalysisResults(
    projectId: string,
    scanId: string,
    reconFindings: ReconFinding[],
    apiFindings: APIFinding[],
    vulnerabilityReport: VulnerabilityReportData,
    fuzzTargets: FuzzTarget[],
    ckgData: CKGData,
    duration: number
): Promise<void> {
    const token = getAuthToken();
    
    if (!token || projectId.startsWith('local-') || scanId.startsWith('local-')) {
        console.warn('⚠️ No auth token or local IDs - skipping database save');
        return;
    }

    try {
        // 1. Update scan status to COMPLETED
        await fetch(`${API_BASE_URL}/api/scans/${scanId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                duration,
            }),
        });

        // 2. Save vulnerabilities
        const allVulnerabilities = [
            ...reconFindings.map(f => ({
                scanId,
                title: f.category,
                description: f.description,
                severity: mapSeverity(f.category),
                category: mapCategory(f.category),
                recommendation: f.recommendation,
                filePath: 'Multiple files',
                status: 'OPEN',
            })),
            ...apiFindings.map(f => ({
                scanId,
                title: f.category,
                description: f.description,
                severity: f.severity.toUpperCase(),
                category: mapAPICategory(f.category),
                recommendation: f.recommendation,
                filePath: 'API endpoints',
                status: 'OPEN',
            })),
            {
                scanId,
                title: vulnerabilityReport.vulnerabilityTitle,
                description: vulnerabilityReport.description,
                severity: vulnerabilityReport.severity.toUpperCase(),
                category: 'OTHER',
                cveId: vulnerabilityReport.cveId !== 'N/A' ? vulnerabilityReport.cveId : null,
                recommendation: vulnerabilityReport.mitigation,
                vulnerableCode: vulnerabilityReport.vulnerableCode,
                filePath: 'Fuzz testing',
                status: 'OPEN',
            }
        ];

        for (const vuln of allVulnerabilities) {
            await fetch(`${API_BASE_URL}/api/vulnerabilities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(vuln),
            });
        }

        // 3. Save scan metrics
        await fetch(`${API_BASE_URL}/api/scan-metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                scanId,
                analysisTime: duration * 1000, // Convert to milliseconds
                totalFunctions: ckgData.nodes.filter(n => n.type === 'Function').length,
                totalClasses: ckgData.nodes.filter(n => n.type === 'Class').length,
                totalFiles: ckgData.nodes.filter(n => n.type === 'File').length,
            }),
        });

        console.log('✅ All analysis results saved to database');
    } catch (error) {
        console.error('❌ Failed to save analysis results:', error);
    }
}

/**
 * Helper: Map recon category to database enum
 */
function mapCategory(category: string): string {
    const categoryMap: Record<string, string> = {
        'Hardcoded Secret': 'HARDCODED_CREDENTIALS',
        'Exposed Path': 'PATH_TRAVERSAL',
        'Insecure Configuration': 'INSECURE_CONFIGURATION',
        'Vulnerable Pattern': 'OTHER',
        'Threat Intel Match': 'OTHER',
    };
    return categoryMap[category] || 'OTHER';
}

/**
 * Helper: Map API category to database enum
 */
function mapAPICategory(category: string): string {
    const categoryMap: Record<string, string> = {
        'BOLA': 'AUTHORIZATION_FLAW',
        'Broken Authentication': 'AUTHENTICATION_BYPASS',
        'Security Misconfiguration': 'INSECURE_CONFIGURATION',
        'SSRF': 'SSRF',
        'Resource Consumption': 'OTHER',
    };
    return categoryMap[category] || 'API_SECURITY';
}

/**
 * Helper: Map recon category to severity
 */
function mapSeverity(category: string): string {
    const severityMap: Record<string, string> = {
        'Hardcoded Secret': 'HIGH',
        'Exposed Path': 'MEDIUM',
        'Insecure Configuration': 'MEDIUM',
        'Vulnerable Pattern': 'HIGH',
        'Threat Intel Match': 'CRITICAL',
    };
    return severityMap[category] || 'MEDIUM';
}
