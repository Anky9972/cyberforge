import React from 'react';
export interface WorkflowStep {
    id: string;
    name: string;
    icon: React.ReactNode;
}
export interface CKGNode {
    id: string;
    label: string;
    type: 'Function' | 'Class' | 'File' | 'Dependency';
}
export interface CKGEdge {
    source: string;
    target: string;
}
export interface CKGData {
    summary: string;
    nodes: CKGNode[];
    edges: CKGEdge[];
}
export interface FuzzTarget {
    functionName: string;
    reasoning: string;
    language: string;
}
export interface ReconFinding {
    category: 'Hardcoded Secret' | 'Exposed Path' | 'Insecure Configuration' | 'Vulnerable Pattern' | 'Threat Intel Match';
    description: string;
    recommendation: string;
    threatIntelMatch?: string;
}
export interface APIFinding {
    category: string;
    description: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    recommendation: string;
}
export interface VulnerabilityReportData {
    vulnerabilityTitle: string;
    cveId: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
    description: string;
    vulnerableCode: string;
    language: string;
    mitigation: string;
}
export interface AgentLog {
    agentName: string;
    icon: React.ReactNode;
    content: React.ReactNode;
    isLoading: boolean;
}
//# sourceMappingURL=types.d.ts.map