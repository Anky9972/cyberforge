/**
 * Attack Surface Visualization
 * Interactive heatmap showing vulnerability density and code complexity
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Code, TrendingUp } from 'lucide-react';

interface FileNode {
    path: string;
    size: number;
    vulnerabilities: number;
    complexity: number;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
    children?: FileNode[];
}

interface AttackSurfaceHeatmapProps {
    codebase: {
        files: Array<{
            path: string;
            linesOfCode: number;
            vulnerabilities: number;
            complexity: number;
        }>;
    };
}

export const AttackSurfaceHeatmap: React.FC<AttackSurfaceHeatmapProps> = ({ codebase }) => {
    const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
    const [viewMode, setViewMode] = useState<'treemap' | 'sunburst'>('treemap');

    // Build hierarchical structure
    const buildTree = (): FileNode => {
        const root: FileNode = {
            path: 'root',
            size: 0,
            vulnerabilities: 0,
            complexity: 0,
            severity: 'none',
            children: []
        };

        codebase.files.forEach(file => {
            const parts = file.path.split('/');
            let current = root;

            parts.forEach((part, index) => {
                if (!current.children) {
                    current.children = [];
                }

                let child = current.children.find(c => c.path === part);
                
                if (!child) {
                    child = {
                        path: part,
                        size: index === parts.length - 1 ? file.linesOfCode : 0,
                        vulnerabilities: index === parts.length - 1 ? file.vulnerabilities : 0,
                        complexity: index === parts.length - 1 ? file.complexity : 0,
                        severity: calculateSeverity(file.vulnerabilities),
                        children: []
                    };
                    current.children.push(child);
                }

                current = child;
            });
        });

        return root;
    };

    const calculateSeverity = (vulnCount: number): 'critical' | 'high' | 'medium' | 'low' | 'none' => {
        if (vulnCount >= 5) return 'critical';
        if (vulnCount >= 3) return 'high';
        if (vulnCount >= 1) return 'medium';
        if (vulnCount === 0) return 'none';
        return 'low';
    };

    const getSeverityColor = (severity: string): string => {
        switch (severity) {
            case 'critical': return 'bg-red-600';
            case 'high': return 'bg-orange-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-blue-500';
            default: return 'bg-green-500';
        }
    };

    const tree = buildTree();

    // Calculate total metrics
    const totalVulns = codebase.files.reduce((sum, f) => sum + f.vulnerabilities, 0);
    const totalLines = codebase.files.reduce((sum, f) => sum + f.linesOfCode, 0);
    const avgComplexity = codebase.files.reduce((sum, f) => sum + f.complexity, 0) / codebase.files.length;

    // Find hotspots
    const hotspots = [...codebase.files]
        .sort((a, b) => b.vulnerabilities - a.vulnerabilities)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-blue-400" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Attack Surface Heatmap</h2>
                        <p className="text-gray-400">Visual vulnerability density analysis</p>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('treemap')}
                        className={`px-4 py-2 rounded transition-colors ${
                            viewMode === 'treemap'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Treemap
                    </button>
                    <button
                        onClick={() => setViewMode('sunburst')}
                        className={`px-4 py-2 rounded transition-colors ${
                            viewMode === 'sunburst'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        Sunburst
                    </button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-red-900/30 to-red-800/30 border border-red-700 rounded-lg p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Vulnerabilities</p>
                            <p className="text-3xl font-bold text-red-400">{totalVulns}</p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-red-400 opacity-50" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-700 rounded-lg p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Lines of Code</p>
                            <p className="text-3xl font-bold text-blue-400">{totalLines.toLocaleString()}</p>
                        </div>
                        <Code className="w-12 h-12 text-blue-400 opacity-50" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700 rounded-lg p-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Avg. Complexity</p>
                            <p className="text-3xl font-bold text-purple-400">{avgComplexity.toFixed(1)}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-purple-400 opacity-50" />
                    </div>
                </motion.div>
            </div>

            {/* Main Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Treemap/Sunburst */}
                <div className="lg:col-span-2 bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">
                        {viewMode === 'treemap' ? 'Vulnerability Treemap' : 'Sunburst Chart'}
                    </h3>
                    
                    {viewMode === 'treemap' ? (
                        <TreemapVisualization tree={tree} onSelect={setSelectedNode} />
                    ) : (
                        <SunburstVisualization tree={tree} onSelect={setSelectedNode} />
                    )}
                </div>

                {/* Hotspots Sidebar */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        Critical Hotspots
                    </h3>
                    
                    <div className="space-y-3">
                        {hotspots.map((file, index) => (
                            <motion.div
                                key={file.path}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gray-800 rounded p-3 border-l-4 border-red-500"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-mono text-gray-300 truncate">
                                            {file.path.split('/').pop()}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {file.path}
                                        </p>
                                    </div>
                                    <span className="ml-2 px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
                                        {file.vulnerabilities}
                                    </span>
                                </div>
                                <div className="mt-2 flex gap-2 text-xs text-gray-400">
                                    <span>{file.linesOfCode} LOC</span>
                                    <span>•</span>
                                    <span>Complexity: {file.complexity}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['Critical', 'High', 'Medium', 'Low', 'None'].map((severity, index) => (
                        <div key={severity} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded ${getSeverityColor(severity.toLowerCase())}`} />
                            <span className="text-sm text-gray-300">{severity}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Treemap Visualization Component
 */
const TreemapVisualization: React.FC<{ tree: FileNode; onSelect: (node: FileNode) => void }> = ({ tree, onSelect }) => {
    const renderNode = (node: FileNode, level: number = 0): React.ReactNode => {
        if (!node.children || node.children.length === 0) return null;

        return (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${100 + level * 20}px, 1fr))` }}>
                {node.children.map((child, index) => {
                    const severity = child.severity || 'none';
                    const colorMap = {
                        critical: 'from-red-600 to-red-700',
                        high: 'from-orange-500 to-orange-600',
                        medium: 'from-yellow-500 to-yellow-600',
                        low: 'from-blue-500 to-blue-600',
                        none: 'from-green-500 to-green-600'
                    };

                    return (
                        <motion.div
                            key={child.path + index}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => onSelect(child)}
                            className={`bg-gradient-to-br ${colorMap[severity]} rounded p-3 cursor-pointer relative overflow-hidden`}
                            style={{ minHeight: `${80 + child.size / 10}px` }}
                        >
                            <div className="relative z-10">
                                <p className="text-white font-semibold text-sm truncate">{child.path}</p>
                                <p className="text-white/80 text-xs mt-1">{child.size} lines</p>
                                {child.vulnerabilities > 0 && (
                                    <p className="text-white font-bold text-lg mt-2">
                                        {child.vulnerabilities} vuln{child.vulnerabilities !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/20" />
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="h-[500px] overflow-auto">
            {renderNode(tree)}
        </div>
    );
};

/**
 * Sunburst Visualization Component
 */
const SunburstVisualization: React.FC<{ tree: FileNode; onSelect: (node: FileNode) => void }> = ({ tree, onSelect }) => {
    return (
        <div className="h-[500px] flex items-center justify-center">
            <p className="text-gray-400">Sunburst chart visualization (SVG implementation would go here)</p>
            <p className="text-sm text-gray-500 mt-2">Interactive radial tree showing hierarchical vulnerability data</p>
        </div>
    );
};

export default AttackSurfaceHeatmap;
