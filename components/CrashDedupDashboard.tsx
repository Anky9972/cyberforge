/**
 * Crash Deduplication Dashboard
 * Features: Crash clustering, fingerprinting, minimization progress, root cause analysis
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug, Fingerprint, Minimize2, TrendingDown, AlertCircle, Code, 
  Filter, ChevronDown, ChevronRight, Download, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export interface CrashInfo {
  id: string;
  timestamp: Date;
  signal?: string;
  stackTrace: string;
  input: string;
  errorMessage?: string;
  taintedVars?: string[];
  mutatedFields?: string[];
}

export interface CrashCluster {
  fingerprint: {
    hash: string;
    stackHash: string;
    signal: string;
    coverageHash: string;
  };
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  crashes: CrashInfo[];
  representative: CrashInfo;
  severity: 'critical' | 'high' | 'medium' | 'low';
  exploitability?: number;
  minimized?: {
    originalSize: number;
    minimizedSize: number;
    reductionPercent: number;
    iterations: number;
  };
}

interface CrashDedupDashboardProps {
  clusters: CrashCluster[];
  onMinimize?: (clusterId: string) => void;
  onDownload?: (clusterId: string) => void;
}

const SEVERITY_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#3B82F6'
};

export const CrashDedupDashboard: React.FC<CrashDedupDashboardProps> = ({
  clusters,
  onMinimize,
  onDownload
}) => {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  // Prepare data for charts
  const severityDistribution = [
    { name: 'Critical', value: clusters.filter(c => c.severity === 'critical').length, color: SEVERITY_COLORS.critical },
    { name: 'High', value: clusters.filter(c => c.severity === 'high').length, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: clusters.filter(c => c.severity === 'medium').length, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: clusters.filter(c => c.severity === 'low').length, color: SEVERITY_COLORS.low },
  ];

  const clusterSizeData = clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(c => ({
      name: c.fingerprint.signal || 'Unknown',
      count: c.count,
      severity: c.severity
    }));

  const minimizationData = clusters
    .filter(c => c.minimized)
    .map(c => ({
      name: c.fingerprint.signal.substring(0, 15),
      reduction: c.minimized!.reductionPercent,
      iterations: c.minimized!.iterations
    }));

  // Filter clusters
  const filteredClusters = clusters.filter(cluster => {
    const matchesSeverity = filterSeverity === 'all' || cluster.severity === filterSeverity;
    const matchesSearch = !searchTerm || 
      cluster.fingerprint.signal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cluster.representative.errorMessage?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{payload[0].payload.name}</p>
          <p className="text-blue-400">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const getSeverityColor = (severity: string) => {
    return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.low;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <Bug className="w-8 h-8 text-red-400" />
              Crash Deduplication
            </h1>
            <p className="text-gray-400 mt-2">
              {clusters.length} unique crash signatures across {clusters.reduce((sum, c) => sum + c.count, 0)} total crashes
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 border border-red-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-400">
                {clusters.filter(c => c.severity === 'critical').length}
              </div>
              <div className="text-xs text-gray-400">Critical</div>
            </div>
            <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 border border-orange-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-400">
                {clusters.filter(c => c.minimized).length}
              </div>
              <div className="text-xs text-gray-400">Minimized</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {clusters.reduce((sum, c) => sum + c.count, 0)}
              </div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Severity Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Crash Clusters */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-400" />
              Top Crash Clusters
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={clusterSizeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 8, 8, 0]}>
                  {clusterSizeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Minimization Progress */}
        {minimizationData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Minimize2 className="w-5 h-5 text-green-400" />
              Input Minimization Progress
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={minimizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" label={{ value: 'Reduction %', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="reduction" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col md:flex-row gap-4 bg-gray-800/50 rounded-2xl p-4 border border-gray-700"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search crashes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex gap-2">
            <Filter className="w-5 h-5 text-gray-400 self-center" />
            {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
              <button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterSeverity === severity
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Crash Clusters List */}
        <div className="space-y-4">
          {filteredClusters.map((cluster, index) => (
            <motion.div
              key={cluster.fingerprint.hash}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all"
            >
              {/* Cluster Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedCluster(expandedCluster === cluster.fingerprint.hash ? null : cluster.fingerprint.hash)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {expandedCluster === cluster.fingerprint.hash ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <Fingerprint className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">
                        {cluster.fingerprint.signal || 'Unknown Signal'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold`} 
                        style={{ backgroundColor: `${getSeverityColor(cluster.severity)}20`, color: getSeverityColor(cluster.severity) }}>
                        {cluster.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Bug className="w-4 h-4" />
                        {cluster.count} crashes
                      </span>
                      <span>First: {new Date(cluster.firstSeen).toLocaleString()}</span>
                      <span>Last: {new Date(cluster.lastSeen).toLocaleString()}</span>
                      {cluster.exploitability !== undefined && (
                        <span className="text-red-400 font-medium">
                          Exploitability: {cluster.exploitability}/100
                        </span>
                      )}
                    </div>

                    {cluster.minimized && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                        <Minimize2 className="w-4 h-4" />
                        Minimized: {cluster.minimized.originalSize} → {cluster.minimized.minimizedSize} bytes 
                        ({cluster.minimized.reductionPercent}% reduction in {cluster.minimized.iterations} iterations)
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {!cluster.minimized && onMinimize && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMinimize(cluster.fingerprint.hash);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
                      >
                        <Minimize2 className="w-4 h-4" />
                        Minimize
                      </button>
                    )}
                    {onDownload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(cluster.fingerprint.hash);
                        }}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedCluster === cluster.fingerprint.hash && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-gray-700 overflow-hidden"
                  >
                    <div className="p-6 space-y-4">
                      {/* Fingerprint Details */}
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                          <Fingerprint className="w-4 h-4 text-blue-400" />
                          Fingerprint
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
                          <div>
                            <span className="text-gray-400">Hash:</span>
                            <span className="text-gray-300 ml-2">{cluster.fingerprint.hash.substring(0, 16)}...</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Stack Hash:</span>
                            <span className="text-gray-300 ml-2">{cluster.fingerprint.stackHash}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Signal:</span>
                            <span className="text-gray-300 ml-2">{cluster.fingerprint.signal}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Coverage Hash:</span>
                            <span className="text-gray-300 ml-2">{cluster.fingerprint.coverageHash}</span>
                          </div>
                        </div>
                      </div>

                      {/* Representative Crash */}
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                          <Code className="w-4 h-4 text-green-400" />
                          Representative Crash
                        </h4>
                        {cluster.representative.errorMessage && (
                          <div className="mb-3 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-sm">
                            {cluster.representative.errorMessage}
                          </div>
                        )}
                        <div className="bg-black/50 rounded p-3 overflow-x-auto">
                          <pre className="text-xs text-gray-300">{cluster.representative.stackTrace}</pre>
                        </div>
                        {cluster.representative.taintedVars && cluster.representative.taintedVars.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-400 mb-2">Tainted Variables:</p>
                            <div className="flex flex-wrap gap-2">
                              {cluster.representative.taintedVars.map((v, i) => (
                                <span key={i} className="px-2 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded text-yellow-300 text-xs">
                                  {v}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {filteredClusters.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Bug className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No crashes found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrashDedupDashboard;
