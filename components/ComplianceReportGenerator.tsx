/**
 * Compliance Report Generator
 * Generates PDF reports mapping vulnerabilities to ISO 27001, PCI-DSS, SOC 2 controls
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

interface Vulnerability {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    cwe: string;
    file: string;
    line: number;
}

interface ComplianceMapping {
    iso27001: string[];
    pciDss: string[];
    soc2: string[];
}

interface ComplianceReportGeneratorProps {
    vulnerabilities: Vulnerability[];
    codebase: {
        name: string;
        totalFiles: number;
        totalLines: number;
        scanDate: Date;
    };
}

export const ComplianceReportGenerator: React.FC<ComplianceReportGeneratorProps> = ({
    vulnerabilities,
    codebase
}) => {
    const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['iso27001', 'pciDss', 'soc2']);
    const [includeDetails, setIncludeDetails] = useState(true);
    const [includeRemediation, setIncludeRemediation] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    /**
     * Map vulnerability categories to compliance controls
     */
    const getComplianceMapping = (vuln: Vulnerability): ComplianceMapping => {
        const mappings: Record<string, ComplianceMapping> = {
            'SQL Injection': {
                iso27001: ['A.14.2.1', 'A.14.2.5', 'A.12.6.1'],
                pciDss: ['6.5.1', '6.3.2', '11.3.1'],
                soc2: ['CC6.1', 'CC6.6', 'CC7.2']
            },
            'Cross-Site Scripting (XSS)': {
                iso27001: ['A.14.2.1', 'A.14.2.5'],
                pciDss: ['6.5.7', '6.3.2'],
                soc2: ['CC6.1', 'CC7.1']
            },
            'Hardcoded Secrets': {
                iso27001: ['A.9.4.3', 'A.10.1.1', 'A.14.2.6'],
                pciDss: ['8.2.1', '8.3.1', '6.3.1'],
                soc2: ['CC6.1', 'CC6.7']
            },
            'Path Traversal': {
                iso27001: ['A.14.2.1', 'A.12.4.1'],
                pciDss: ['6.5.8', '6.3.2'],
                soc2: ['CC6.1', 'CC6.6']
            },
            'Command Injection': {
                iso27001: ['A.14.2.1', 'A.14.2.8'],
                pciDss: ['6.5.1', '6.3.2'],
                soc2: ['CC6.1', 'CC6.6']
            },
            'Insecure Deserialization': {
                iso27001: ['A.14.2.1', 'A.14.2.7'],
                pciDss: ['6.5.8', '6.3.2'],
                soc2: ['CC6.1', 'CC7.2']
            }
        };

        return mappings[vuln.category] || {
            iso27001: ['A.14.2.1'],
            pciDss: ['6.5.10'],
            soc2: ['CC6.1']
        };
    };

    /**
     * Generate executive summary
     */
    const generateExecutiveSummary = () => {
        const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
        const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
        const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
        const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

        const riskScore = (criticalCount * 10 + highCount * 5 + mediumCount * 2 + lowCount) / vulnerabilities.length;
        const grade = riskScore > 7 ? 'Critical' : riskScore > 5 ? 'High' : riskScore > 3 ? 'Medium' : 'Low';

        return {
            totalVulnerabilities: vulnerabilities.length,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            riskScore: riskScore.toFixed(1),
            grade
        };
    };

    /**
     * Generate compliance gap analysis
     */
    const generateGapAnalysis = () => {
        const gaps: Record<string, { total: number; failing: number; controls: Set<string> }> = {
            iso27001: { total: 0, failing: 0, controls: new Set() },
            pciDss: { total: 0, failing: 0, controls: new Set() },
            soc2: { total: 0, failing: 0, controls: new Set() }
        };

        vulnerabilities.forEach(vuln => {
            const mapping = getComplianceMapping(vuln);
            
            if (selectedFrameworks.includes('iso27001')) {
                mapping.iso27001.forEach(control => {
                    gaps.iso27001.controls.add(control);
                    gaps.iso27001.failing++;
                });
            }
            
            if (selectedFrameworks.includes('pciDss')) {
                mapping.pciDss.forEach(control => {
                    gaps.pciDss.controls.add(control);
                    gaps.pciDss.failing++;
                });
            }
            
            if (selectedFrameworks.includes('soc2')) {
                mapping.soc2.forEach(control => {
                    gaps.soc2.controls.add(control);
                    gaps.soc2.failing++;
                });
            }
        });

        return {
            iso27001: {
                affectedControls: gaps.iso27001.controls.size,
                totalViolations: gaps.iso27001.failing,
                complianceRate: ((114 - gaps.iso27001.controls.size) / 114 * 100).toFixed(1)
            },
            pciDss: {
                affectedControls: gaps.pciDss.controls.size,
                totalViolations: gaps.pciDss.failing,
                complianceRate: ((329 - gaps.pciDss.controls.size) / 329 * 100).toFixed(1)
            },
            soc2: {
                affectedControls: gaps.soc2.controls.size,
                totalViolations: gaps.soc2.failing,
                complianceRate: ((64 - gaps.soc2.controls.size) / 64 * 100).toFixed(1)
            }
        };
    };

    /**
     * Generate PDF report (simulation - would use library like jsPDF in production)
     */
    const generatePDF = async () => {
        setIsGenerating(true);

        const summary = generateExecutiveSummary();
        const gapAnalysis = generateGapAnalysis();

        // Simulate PDF generation delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In production, use jsPDF or similar library
        const reportContent = {
            metadata: {
                title: `${codebase.name} - Security Compliance Report`,
                date: codebase.scanDate.toISOString(),
                frameworks: selectedFrameworks
            },
            executiveSummary: summary,
            gapAnalysis,
            vulnerabilities: vulnerabilities.map(v => ({
                ...v,
                complianceMapping: getComplianceMapping(v)
            }))
        };

        // Create downloadable JSON (would be PDF in production)
        const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${Date.now()}.json`;
        a.click();

        setIsGenerating(false);
    };

    const summary = generateExecutiveSummary();
    const gapAnalysis = generateGapAnalysis();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-400" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Compliance Report Generator</h2>
                        <p className="text-gray-400">ISO 27001, PCI-DSS, SOC 2 mapping</p>
                    </div>
                </div>

                <button
                    onClick={generatePDF}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                    <Download className="w-5 h-5" />
                    {isGenerating ? 'Generating...' : 'Export PDF'}
                </button>
            </div>

            {/* Configuration */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
                
                <div className="space-y-4">
                    {/* Framework Selection */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Compliance Frameworks</label>
                        <div className="flex gap-4">
                            {[
                                { id: 'iso27001', name: 'ISO 27001' },
                                { id: 'pciDss', name: 'PCI-DSS' },
                                { id: 'soc2', name: 'SOC 2' }
                            ].map(framework => (
                                <label key={framework.id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedFrameworks.includes(framework.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFrameworks([...selectedFrameworks, framework.id]);
                                            } else {
                                                setSelectedFrameworks(selectedFrameworks.filter(f => f !== framework.id));
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-gray-600"
                                    />
                                    <span className="text-gray-300">{framework.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeDetails}
                                onChange={(e) => setIncludeDetails(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600"
                            />
                            <span className="text-gray-300">Include vulnerability details</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeRemediation}
                                onChange={(e) => setIncludeRemediation(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600"
                            />
                            <span className="text-gray-300">Include remediation guidance</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Executive Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Risk Assessment */}
                    <div>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">Overall Risk Score</span>
                                <span className={`text-2xl font-bold ${
                                    summary.grade === 'Critical' ? 'text-red-400' :
                                    summary.grade === 'High' ? 'text-orange-400' :
                                    summary.grade === 'Medium' ? 'text-yellow-400' :
                                    'text-green-400'
                                }`}>
                                    {summary.riskScore}/10
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full ${
                                        summary.grade === 'Critical' ? 'bg-red-500' :
                                        summary.grade === 'High' ? 'bg-orange-500' :
                                        summary.grade === 'Medium' ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    }`}
                                    style={{ width: `${parseFloat(summary.riskScore) * 10}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                                <span className="text-gray-300">Critical</span>
                                <span className="text-red-400 font-semibold">{summary.criticalCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-orange-900/20 rounded">
                                <span className="text-gray-300">High</span>
                                <span className="text-orange-400 font-semibold">{summary.highCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-yellow-900/20 rounded">
                                <span className="text-gray-300">Medium</span>
                                <span className="text-yellow-400 font-semibold">{summary.mediumCount}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-blue-900/20 rounded">
                                <span className="text-gray-300">Low</span>
                                <span className="text-blue-400 font-semibold">{summary.lowCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Compliance Status */}
                    <div className="space-y-4">
                        {selectedFrameworks.includes('iso27001') && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-300 font-medium">ISO 27001</span>
                                    <span className="text-lg font-bold text-blue-400">
                                        {gapAnalysis.iso27001.complianceRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${gapAnalysis.iso27001.complianceRate}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {gapAnalysis.iso27001.affectedControls} controls affected
                                </p>
                            </div>
                        )}

                        {selectedFrameworks.includes('pciDss') && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-300 font-medium">PCI-DSS</span>
                                    <span className="text-lg font-bold text-purple-400">
                                        {gapAnalysis.pciDss.complianceRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-purple-500 h-2 rounded-full"
                                        style={{ width: `${gapAnalysis.pciDss.complianceRate}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {gapAnalysis.pciDss.affectedControls} requirements affected
                                </p>
                            </div>
                        )}

                        {selectedFrameworks.includes('soc2') && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-300 font-medium">SOC 2</span>
                                    <span className="text-lg font-bold text-green-400">
                                        {gapAnalysis.soc2.complianceRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${gapAnalysis.soc2.complianceRate}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {gapAnalysis.soc2.affectedControls} trust criteria affected
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Vulnerability Mappings */}
            {includeDetails && (
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Vulnerability-to-Control Mapping</h3>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {vulnerabilities.slice(0, 10).map((vuln, index) => {
                            const mapping = getComplianceMapping(vuln);
                            
                            return (
                                <motion.div
                                    key={vuln.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-gray-800 rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{vuln.title}</p>
                                            <p className="text-sm text-gray-400">{vuln.file}:{vuln.line}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            vuln.severity === 'critical' ? 'bg-red-900 text-red-300' :
                                            vuln.severity === 'high' ? 'bg-orange-900 text-orange-300' :
                                            vuln.severity === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                                            'bg-blue-900 text-blue-300'
                                        }`}>
                                            {vuln.severity}
                                        </span>
                                    </div>

                                    <div className="flex gap-4 mt-3 text-xs">
                                        {selectedFrameworks.includes('iso27001') && (
                                            <div>
                                                <span className="text-gray-500">ISO 27001:</span>
                                                <span className="ml-1 text-blue-400">{mapping.iso27001.join(', ')}</span>
                                            </div>
                                        )}
                                        {selectedFrameworks.includes('pciDss') && (
                                            <div>
                                                <span className="text-gray-500">PCI-DSS:</span>
                                                <span className="ml-1 text-purple-400">{mapping.pciDss.join(', ')}</span>
                                            </div>
                                        )}
                                        {selectedFrameworks.includes('soc2') && (
                                            <div>
                                                <span className="text-gray-500">SOC 2:</span>
                                                <span className="ml-1 text-green-400">{mapping.soc2.join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplianceReportGenerator;
