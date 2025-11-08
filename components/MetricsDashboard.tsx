import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, AlertTriangle, AlertOctagon, TrendingUp, Activity } from 'lucide-react';

export interface Metrics {
    filesScanned: number;
    functionsAnalyzed: number;
    vulnerabilitiesFound: number;
    criticalFindings: number;
}

interface MetricsDashboardProps {
    metrics: Metrics;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
    const metricCards = [
        {
            label: "Files Scanned",
            value: metrics.filesScanned,
            icon: FileText,
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/30"
        },
        {
            label: "Functions Analyzed",
            value: metrics.functionsAnalyzed,
            icon: Cpu,
            color: "from-purple-500 to-pink-500",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/30"
        },
        {
            label: "Issues Found",
            value: metrics.vulnerabilitiesFound,
            icon: AlertTriangle,
            color: "from-yellow-500 to-orange-500",
            bgColor: "bg-yellow-500/10",
            borderColor: "border-yellow-500/30"
        },
        {
            label: "Critical",
            value: metrics.criticalFindings,
            icon: AlertOctagon,
            color: "from-red-500 to-pink-500",
            bgColor: "bg-red-500/10",
            borderColor: "border-red-500/30"
        }
    ];

    return (
        <div className="mb-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-6"
            >
                <Activity className="w-6 h-6 text-blue-400" />
                <h2 className="text-2xl font-bold text-white">Analysis Metrics</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricCards.map((metric, index) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`relative bg-gradient-to-br from-gray-800 to-gray-900 border ${metric.borderColor} rounded-2xl p-6 overflow-hidden group`}
                    >
                        {/* Background glow */}
                        <div className={`absolute inset-0 ${metric.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                        
                        {/* Icon background circle */}
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${metric.color} opacity-10 rounded-full blur-2xl`}></div>

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg`}>
                                    <metric.icon className="w-6 h-6 text-white" />
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                                    className="flex items-center gap-1 text-green-400"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                            >
                                <div className="text-4xl font-bold text-white mb-2">
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 + index * 0.1 }}
                                    >
                                        {metric.value}
                                    </motion.span>
                                </div>
                                <div className="text-sm font-medium text-gray-400">
                                    {metric.label}
                                </div>
                            </motion.div>
                        </div>

                        {/* Bottom accent line */}
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                            className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.color} origin-left`}
                        ></motion.div>
                    </motion.div>
                ))}
            </div>

            {/* Summary bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="mt-6 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6"
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">Analysis Complete</div>
                            <div className="text-lg font-semibold text-white">
                                {metrics.vulnerabilitiesFound > 0 
                                    ? `Found ${metrics.vulnerabilitiesFound} potential issue${metrics.vulnerabilitiesFound !== 1 ? 's' : ''}`
                                    : 'No critical issues detected'
                                }
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm font-medium">
                            ✓ Analysis Complete
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default MetricsDashboard;
