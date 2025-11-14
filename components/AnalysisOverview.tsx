import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronDown, 
    ChevronUp, 
    Download, 
    Share2, 
    BarChart3,
    FileCode,
    Shield,
    Bug,
    Target,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle,
    ExternalLink,
    Eye,
    Database
} from 'lucide-react';
import type { AgentLog, VulnerabilityReportData } from '../types';
import { useNavigate } from 'react-router-dom';

interface AnalysisOverviewProps {
    agentLogs: AgentLog[];
    report: VulnerabilityReportData | null;
    fileName: string;
    analysisStartTime: number;
    analysisEndTime: number;
    fileCount: number;
    linesOfCode: number;
    onNavigateToDashboard?: () => void;
    onExportReport?: () => void;
}

const AnalysisOverview: React.FC<AnalysisOverviewProps> = ({
    agentLogs,
    report,
    fileName,
    analysisStartTime,
    analysisEndTime,
    fileCount,
    linesOfCode,
    onNavigateToDashboard,
    onExportReport
}) => {
    const navigate = useNavigate();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        overview: true,
        recon: false,
        api: false,
        ckg: false,
        fuzzing: false,
        report: true
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const duration = ((analysisEndTime - analysisStartTime) / 1000).toFixed(2);

    // Extract findings counts from agent logs
    const reconLog = agentLogs.find(log => log.agentName.includes('Reconnaissance'));
    const apiLog = agentLogs.find(log => log.agentName.includes('API Security'));
    const ckgLog = agentLogs.find(log => log.agentName.includes('Knowledge Graph'));
    const fuzzLog = agentLogs.find(log => log.agentName.includes('Fuzzing'));

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-xl p-8 shadow-2xl"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <CheckCircle className="w-8 h-8" />
                            Analysis Complete
                        </h1>
                        <p className="text-blue-100 text-lg">{fileName}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-blue-100 text-sm">Duration</div>
                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                            <Clock className="w-6 h-6" />
                            {duration}s
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <CollapsibleSection
                    title="Analysis Overview"
                    icon={<BarChart3 className="w-5 h-5" />}
                    isExpanded={expandedSections.overview}
                    onToggle={() => toggleSection('overview')}
                    badge={`${fileCount} files`}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            icon={<FileCode className="w-8 h-8 text-blue-400" />}
                            label="Files Analyzed"
                            value={fileCount.toString()}
                        />
                        <StatCard
                            icon={<BarChart3 className="w-8 h-8 text-green-400" />}
                            label="Lines of Code"
                            value={linesOfCode.toLocaleString()}
                        />
                        <StatCard
                            icon={<Bug className="w-8 h-8 text-red-400" />}
                            label="Vulnerabilities"
                            value={report ? "1+" : "0"}
                        />
                        <StatCard
                            icon={<Shield className="w-8 h-8 text-purple-400" />}
                            label="Security Score"
                            value={report?.severity === 'Critical' ? '25/100' : report?.severity === 'High' ? '45/100' : '75/100'}
                        />
                    </div>
                </CollapsibleSection>
            </motion.div>

            {/* Reconnaissance Results */}
            {reconLog && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <CollapsibleSection
                        title="Static & Reconnaissance Analysis"
                        icon={reconLog.icon}
                        isExpanded={expandedSections.recon}
                        onToggle={() => toggleSection('recon')}
                        badge={reconLog.isLoading ? 'Processing...' : 'Complete'}
                    >
                        <div className="prose prose-invert max-w-none">
                            {reconLog.content}
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* API Security Results */}
            {apiLog && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <CollapsibleSection
                        title="API Security Analysis"
                        icon={apiLog.icon}
                        isExpanded={expandedSections.api}
                        onToggle={() => toggleSection('api')}
                        badge={apiLog.isLoading ? 'Processing...' : 'Complete'}
                    >
                        <div className="prose prose-invert max-w-none">
                            {apiLog.content}
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* Code Knowledge Graph */}
            {ckgLog && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <CollapsibleSection
                        title="Code Knowledge Graph"
                        icon={ckgLog.icon}
                        isExpanded={expandedSections.ckg}
                        onToggle={() => toggleSection('ckg')}
                        badge={ckgLog.isLoading ? 'Processing...' : 'Complete'}
                    >
                        <div className="prose prose-invert max-w-none">
                            {ckgLog.content}
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* Fuzzing Results */}
            {fuzzLog && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <CollapsibleSection
                        title="Fuzzing Analysis"
                        icon={fuzzLog.icon}
                        isExpanded={expandedSections.fuzzing}
                        onToggle={() => toggleSection('fuzzing')}
                        badge={fuzzLog.isLoading ? 'Processing...' : 'Complete'}
                    >
                        <div className="prose prose-invert max-w-none">
                            {fuzzLog.content}
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* Final Vulnerability Report */}
            {report && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <CollapsibleSection
                        title="Vulnerability Report"
                        icon={<AlertTriangle className="w-5 h-5" />}
                        isExpanded={expandedSections.report}
                        onToggle={() => toggleSection('report')}
                        badge={
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                report.severity === 'Critical' ? 'bg-red-600 text-white' :
                                report.severity === 'High' ? 'bg-orange-600 text-white' :
                                report.severity === 'Medium' ? 'bg-yellow-600 text-black' :
                                'bg-blue-600 text-white'
                            }`}>
                                {report.severity}
                            </span>
                        }
                    >
                        <div className="space-y-6">
                            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                                <h3 className="text-2xl font-bold text-white mb-4">{report.vulnerabilityTitle}</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <span className="text-gray-400 text-sm">CVE ID:</span>
                                        <p className="text-white font-mono">{report.cveId}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 text-sm">Language:</span>
                                        <p className="text-white">{report.language}</p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <span className="text-gray-400 text-sm block mb-2">Description:</span>
                                    <p className="text-gray-300">{report.description}</p>
                                </div>
                                <div className="mb-4">
                                    <span className="text-gray-400 text-sm block mb-2">Vulnerable Code:</span>
                                    <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto border border-gray-700">
                                        <code className="text-red-400 text-sm">{report.vulnerableCode}</code>
                                    </pre>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-sm block mb-2">Mitigation:</span>
                                    <p className="text-green-400">{report.mitigation}</p>
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>
                </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-4 justify-center pt-6"
            >
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    <Database className="w-5 h-5" />
                    View Dashboard
                </button>
                
                <button
                    onClick={onExportReport}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                >
                    <Download className="w-5 h-5" />
                    Export Report
                </button>
                
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                >
                    <Share2 className="w-5 h-5" />
                    Share Results
                </button>
                
                <button
                    onClick={() => navigate('/graph-viewer')}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                >
                    <Eye className="w-5 h-5" />
                    Visualize Graph
                </button>
            </motion.div>
        </div>
    );
};

// Collapsible Section Component
interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    badge?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    children,
    isExpanded,
    onToggle,
    badge
}) => {
    return (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden backdrop-blur-sm">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-700/30 transition-colors duration-200"
            >
                <div className="flex items-center gap-3">
                    <div className="text-blue-400">
                        {icon}
                    </div>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    {badge && typeof badge === 'string' && (
                        <span className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm">
                            {badge}
                        </span>
                    )}
                    {badge && typeof badge !== 'string' && badge}
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                </motion.div>
            </button>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 border-t border-gray-700/50">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Stat Card Component
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => {
    return (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-blue-500/50 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <span className="text-gray-400 text-sm">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
};

export default AnalysisOverview;
