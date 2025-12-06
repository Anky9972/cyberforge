/**
 * Database Service - Bridge between frontend fuzzing workflow and backend database
 * Saves analysis results to PostgreSQL via backend API
 */
import type { VulnerabilityReportData, ReconFinding, APIFinding, FuzzTarget, CKGData } from '../types';
/**
 * Create a new project for the codebase being analyzed
 */
export declare function createProject(fileName: string, language?: string): Promise<string>;
/**
 * Create a new scan record
 */
export declare function createScan(projectId: string, filesScanned: number, linesOfCode: number): Promise<string>;
/**
 * Save complete analysis results to database
 */
export declare function saveAnalysisResults(projectId: string, scanId: string, reconFindings: ReconFinding[], apiFindings: APIFinding[], vulnerabilityReport: VulnerabilityReportData, fuzzTargets: FuzzTarget[], ckgData: CKGData, duration: number): Promise<void>;
//# sourceMappingURL=databaseService.d.ts.map