import React from 'react';

export interface WorkflowStep {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// -- CKG Visualization Types --
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
// -----------------------------

export interface FuzzTarget {
  functionName: string;
  reasoning: string;
  language: string;
}

export interface ReconFinding {
  category: 'Hardcoded Secret' | 'Exposed Path' | 'Insecure Configuration' | 'Vulnerable Pattern' | 'Threat Intel Match';
  description: string;
  recommendation: string;
  threatIntelMatch?: string; // e.g., 'CVE-2023-1234' or 'Log4Shell Pattern'
}

export interface APIFinding {
  category: string; // Will be mapped to one of our standard categories
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