import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    Download,
    Share2,
    BarChart3,
    FileCode,
    Shield,
    Bug,
    Clock,
    CheckCircle,
    AlertTriangle,
    Eye,
    Database,
    Zap,
    Cpu,
    Network
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

const RadialScore: React.FC<{ score: number; label: string }> = ({ score, label }) => {
    const circumference = 2 * Math.PI * 60; // radius 60
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score > 70 ? '#22c55e' : score > 40 ? '#eab308' : '#ef4444';

    return (
        <div className="relative flex flex-col items-center justify-center">
            <svg className="w-40 h-40 transform -rotate-90">
                <circle
                    cx="80"
                    cy="80"
                    r="60"
                    stroke="#1f2937"
                    strokeWidth="12"
                    fill="transparent"
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="80"
                    cy="80"
                    r="60"
                    stroke={color}
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{score}</span>
                <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Score</span>
            </div>
            <p className="mt-2 text-gray-300 font-medium">{label}</p>
        </div>
    );
};

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

    // Determine score based on severity (Mock logic for visual)
    const securityScore = report?.severity === 'Critical' ? 25 : report?.severity === 'High' ? 55 : 88;
    const scoreLabel = securityScore > 70 ? 'Excellent' : securityScore > 50 ? 'Needs Improvement' : 'Critical Risk';

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Hero Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-2xl border border-gray-700 relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-900/40 border border-green-500/30 rounded-full text-green-400 text-sm font-medium">
                            <CheckCircle size={14} />
                            Analysis Complete
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                            Project Analysis
                        </h1>
                        <p className="text-xl text-blue-200/80 font-light max-w-lg">
                            Comprehensive security scan results for <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">{fileName}</span>
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700">
                                <Clock className="text-blue-400" size={18} />
                                <span className="text-gray-300 font-mono">{duration}s</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-700">
                                <FileCode className="text-purple-400" size={18} />
                                <span className="text-gray-300 font-mono">{linesOfCode.toLocaleString()} LOC</span>
                            </div>
                        </div>
                    </div>

                    {/* Radial Score with Glow */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                        <div className="bg-gray-900/80 p-6 rounded-2xl border border-gray-700 backdrop-blur-sm shadow-xl">
                            <RadialScore score={securityScore} label={scoreLabel} />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<FileCode className="w-6 h-6 text-blue-400" />}
                    label="Files Scanned"
                    value={fileCount.toString()}
                    delay={0.1}
                />
                <StatCard
                    icon={<Zap className="w-6 h-6 text-yellow-400" />}
                    label="Active Agents"
                    value="4"
                    delay={0.2}
                />
                <StatCard
                    icon={<Bug className="w-6 h-6 text-red-500" />}
                    label="Vulns Found"
                    value={report ? "1+" : "0"}
                    highlight
                    delay={0.3}
                />
                <StatCard
                    icon={<Database className="w-6 h-6 text-purple-400" />}
                    label="Knowledge Graph"
                    value="Generated"
                    delay={0.4}
                />
            </div>

            {/* Detailed Sections */}
            <div className="space-y-4">
                {/* Reconnaissance Results */}
                {reconLog && (
                    <CollapsibleSection
                        id="recon"
                        title="Static & Reconnaissance"
                        icon={<Cpu />}
                        isExpanded={expandedSections.recon}
                        onToggle={() => toggleSection('recon')}
                        content={reconLog.content}
                        color="blue"
                    />
                )}

                {/* API Security Results */}
                {apiLog && (
                    <CollapsibleSection
                        id="api"
                        title="API Security Analysis"
                        icon={<Network />}
                        isExpanded={expandedSections.api}
                        onToggle={() => toggleSection('api')}
                        content={apiLog.content}
                        color="purple"
                    />
                )}

                {/* CKG Results */}
                {ckgLog && (
                    <CollapsibleSection
                        id="ckg"
                        title="Code Knowledge Graph"
                        icon={<Share2 />}
                        isExpanded={expandedSections.ckg}
                        onToggle={() => toggleSection('ckg')}
                        content={ckgLog.content}
                        color="cyan"
                    />
                )}

                {/* Fuzzing Results */}
                {fuzzLog && (
                    <CollapsibleSection
                        id="fuzzing"
                        title="Fuzzing Analysis"
                        icon={<Zap />}
                        isExpanded={expandedSections.fuzzing}
                        onToggle={() => toggleSection('fuzzing')}
                        content={fuzzLog.content}
                        color="orange"
                    />
                )}
            </div>

            {/* Final Vulnerability Report Card */}
            {report && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gray-800 rounded-2xl border-2 border-red-500/20 overflow-hidden shadow-2xl"
                >
                    <div className="bg-red-900/20 p-6 border-b border-red-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-xl">
                                <AlertTriangle className="text-red-500 w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Critical Finding</h2>
                                <p className="text-red-300 opacity-80">{report.vulnerabilityTitle}</p>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider ${report.severity === 'Critical' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                                report.severity === 'High' ? 'bg-orange-500 text-white' :
                                    'bg-blue-500 text-white'
                            }`}>
                            {report.severity} Severity
                        </span>
                    </div>

                    <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-gray-800 to-gray-900">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Description</h3>
                                <p className="text-gray-200 leading-relaxed">{report.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                    <span className="text-gray-500 text-xs uppercase block mb-1">CVE ID</span>
                                    <span className="text-white font-mono font-bold">{report.cveId}</span>
                                </div>
                                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                                    <span className="text-gray-500 text-xs uppercase block mb-1">Language</span>
                                    <span className="text-white font-bold">{report.language}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Vulnerable Code</h3>
                            <pre className="bg-black/50 p-6 rounded-xl border border-gray-800 overflow-x-auto relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-gray-500">Copy</span>
                                </div>
                                <code className="text-red-400 font-mono text-sm">{report.vulnerableCode}</code>
                            </pre>
                        </div>

                        <div>
                            <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Remediation</h3>
                            <div className="bg-green-900/10 border border-green-500/20 p-6 rounded-xl">
                                <p className="text-green-300 leading-relaxed">{report.mitigation}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Action Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-4 justify-center pt-6 pb-12"
            >
                <ActionButton
                    onClick={() => navigate('/dashboard')}
                    icon={<Database className="w-5 h-5" />}
                    label="View Dashboard"
                    primary
                />
                <ActionButton
                    onClick={onExportReport}
                    icon={<Download className="w-5 h-5" />}
                    label="Export Report"
                />
                <ActionButton
                    onClick={() => navigate('/graph-viewer')}
                    icon={<Eye className="w-5 h-5" />}
                    label="Visualize Graph"
                />
            </motion.div>
        </div>
    );
};

// --- Subcomponents for Cleanliness ---

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; highlight?: boolean; delay: number }> = ({
    icon, label, value, highlight, delay
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className={`p-5 rounded-2xl border ${highlight ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800/50 border-gray-700/50'
            } backdrop-blur-sm flex flex-col items-center justify-center text-center gap-2`}
    >
        <div className={`p-2 rounded-lg ${highlight ? 'bg-red-500/20' : 'bg-gray-700/50'}`}>
            {icon}
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</div>
    </motion.div>
);

const CollapsibleSection: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    content: React.ReactNode;
    color: string
}> = ({ title, icon, isExpanded, onToggle, content, color }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-750 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-400`}>
                        {icon}
                    </div>
                    <span className="font-bold text-white text-lg">{title}</span>
                </div>
                <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 border-t border-gray-700/50 prose prose-invert max-w-none text-gray-300">
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ActionButton: React.FC<{ onClick?: () => void; icon: React.ReactNode; label: string; primary?: boolean }> = ({
    onClick, icon, label, primary
}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${primary
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-blue-500/25'
                : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-500'
            }`}
    >
        {icon}
        {label}
    </button>
);

export default AnalysisOverview;
