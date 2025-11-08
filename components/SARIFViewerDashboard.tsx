/**
 * SARIF Viewer Dashboard
 * Features: GitHub PR annotations, inline code comments, CI badge generation, SARIF JSON tree viewer
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Upload, Code, GitPullRequest, Shield,
  AlertTriangle, Bug, CheckCircle, Copy, ExternalLink,
  ChevronRight, ChevronDown, Filter, Search
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export interface SARIFResult {
  ruleId: string;
  level: 'error' | 'warning' | 'note';
  message: string;
  locations: Array<{
    physicalLocation: {
      artifactLocation: { uri: string };
      region: {
        startLine: number;
        endLine: number;
        snippet: { text: string };
      };
    };
  }>;
  fixes?: Array<{
    description: string;
    artifactChanges: Array<{
      artifactLocation: { uri: string };
      replacements: Array<{
        deletedRegion: { startLine: number; endLine: number };
        insertedContent: { text: string };
      }>;
    }>;
  }>;
}

export interface SARIFReport {
  version: string;
  runs: Array<{
    tool: {
      driver: {
        name: string;
        version: string;
        rules: Array<{
          id: string;
          name: string;
          shortDescription: { text: string };
          fullDescription?: { text: string };
          defaultConfiguration: { level: string };
        }>;
      };
    };
    results: SARIFResult[];
  }>;
}

interface SARIFViewerDashboardProps {
  report?: SARIFReport;
  onImport?: (file: File) => void;
  onExport?: () => void;
  onGenerateBadge?: () => string;
}

const LEVEL_COLORS = {
  error: '#EF4444',
  warning: '#F59E0B',
  note: '#3B82F6',
};

const LEVEL_ICONS = {
  error: Bug,
  warning: AlertTriangle,
  note: Shield,
};

export const SARIFViewerDashboard: React.FC<SARIFViewerDashboardProps> = ({
  report,
  onImport,
  onExport,
  onGenerateBadge
}) => {
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-20 h-20 text-gray-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">No SARIF Report Loaded</h2>
          <p className="text-gray-400 mb-6">Import a SARIF file to view vulnerability annotations</p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".sarif,.json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onImport?.(e.target.files[0])}
            />
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
              <Upload className="w-5 h-5" />
              Import SARIF File
            </div>
          </label>
        </div>
      </div>
    );
  }

  const run = report.runs[0];
  const results = run?.results || [];
  
  // Filter results
  const filteredResults = results.filter(result => {
    const matchesLevel = !filterLevel || result.level === filterLevel;
    const matchesSearch = !searchQuery || 
      result.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.ruleId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: results.length,
    errors: results.filter(r => r.level === 'error').length,
    warnings: results.filter(r => r.level === 'warning').length,
    notes: results.filter(r => r.level === 'note').length,
  };

  // Group by severity
  const severityData = [
    { name: 'Errors', value: stats.errors, color: LEVEL_COLORS.error },
    { name: 'Warnings', value: stats.warnings, color: LEVEL_COLORS.warning },
    { name: 'Notes', value: stats.notes, color: LEVEL_COLORS.note },
  ];

  // Group by file
  const fileDistribution = results.reduce((acc, result) => {
    const uri = result.locations[0]?.physicalLocation?.artifactLocation?.uri || 'Unknown';
    const fileName = uri.split('/').pop() || uri;
    acc[fileName] = (acc[fileName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topFiles = Object.entries(fileDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const handleCopyBadge = () => {
    const badge = onGenerateBadge?.() || `![Security](https://img.shields.io/badge/vulnerabilities-${stats.total}-${stats.errors > 0 ? 'red' : stats.warnings > 0 ? 'yellow' : 'green'})`;
    navigator.clipboard.writeText(badge);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-blue-400">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
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
              <FileText className="w-8 h-8 text-blue-400" />
              SARIF Report Viewer
            </h1>
            <p className="text-gray-400 mt-2">
              {run.tool.driver.name} v{run.tool.driver.version} • {stats.total} findings
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowRawJSON(!showRawJSON)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              {showRawJSON ? 'Hide JSON' : 'View JSON'}
            </button>
            <button
              onClick={handleCopyBadge}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2"
            >
              {copiedBadge ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedBadge ? 'Copied!' : 'Copy Badge'}
            </button>
            <button
              onClick={onExport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Issues', value: stats.total, icon: FileText, color: 'blue' },
            { label: 'Errors', value: stats.errors, icon: Bug, color: 'red' },
            { label: 'Warnings', value: stats.warnings, icon: AlertTriangle, color: 'yellow' },
            { label: 'Notes', value: stats.notes, icon: Shield, color: 'green' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-gradient-to-br from-${stat.color}-900/30 to-${stat.color}-800/30 border border-${stat.color}-500/30 rounded-xl p-4`}
            >
              <stat.icon className={`w-6 h-6 text-${stat.color}-400 mb-2`} />
              <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Severity Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top Files */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Top Files with Issues
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topFiles} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* GitHub PR Badge Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-purple-500/30"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-purple-400" />
            GitHub PR Integration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-bold text-gray-400 mb-3">CI Badge</h4>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300">
                {`![Security](https://img.shields.io/badge/vulnerabilities-${stats.total}-${stats.errors > 0 ? 'red' : stats.warnings > 0 ? 'yellow' : 'green'})`}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-400 mb-3">Preview</h4>
              <div className="bg-white rounded-lg p-4 inline-block">
                <img
                  src={`https://img.shields.io/badge/vulnerabilities-${stats.total}-${stats.errors > 0 ? 'red' : stats.warnings > 0 ? 'yellow' : 'green'}`}
                  alt="Security Badge"
                  className="h-5"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-bold text-gray-400 mb-3">PR Comment Template</h4>
            <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-300 whitespace-pre-wrap">
{`## 🔒 Security Analysis Results

**Total Issues:** ${stats.total}
- ❌ ${stats.errors} Error${stats.errors !== 1 ? 's' : ''}
- ⚠️ ${stats.warnings} Warning${stats.warnings !== 1 ? 's' : ''}
- ℹ️ ${stats.notes} Note${stats.notes !== 1 ? 's' : ''}

${stats.errors > 0 ? '⛔ **BLOCKING:** Critical security issues found!' : '✅ No critical issues detected.'}

[View detailed SARIF report](#)`}
            </div>
          </div>
        </motion.div>

        {/* Raw JSON Viewer */}
        <AnimatePresence>
          {showRawJSON && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-green-400" />
                Raw SARIF JSON
              </h3>
              <div className="bg-black/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by rule ID or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {['error', 'warning', 'note'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(filterLevel === level ? null : level)}
                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  filterLevel === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {React.createElement(LEVEL_ICONS[level as keyof typeof LEVEL_ICONS], { className: 'w-4 h-4' })}
                {level.charAt(0).toUpperCase() + level.slice(1)}s
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-400" />
            Findings ({filteredResults.length})
          </h3>

          {filteredResults.map((result, index) => {
            const isExpanded = selectedResult === index;
            const Icon = LEVEL_ICONS[result.level];
            const location = result.locations[0]?.physicalLocation;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedResult(isExpanded ? null : index)}
                >
                  <div className="flex items-start gap-4">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400 mt-1" /> : <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />}
                    <Icon className="w-5 h-5 mt-1" style={{ color: LEVEL_COLORS[result.level] }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-blue-400">{result.ruleId}</span>
                        <span
                          className="px-2 py-1 rounded text-xs font-bold uppercase"
                          style={{ backgroundColor: `${LEVEL_COLORS[result.level]}20`, color: LEVEL_COLORS[result.level] }}
                        >
                          {result.level}
                        </span>
                      </div>
                      <p className="text-white font-medium mb-2">{result.message}</p>
                      {location && (
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          {location.artifactLocation.uri}:{location.region.startLine}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-700"
                    >
                      <div className="p-4 bg-gray-900/50 space-y-4">
                        {/* Code Snippet */}
                        {location?.region?.snippet && (
                          <div>
                            <h5 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              Code Snippet (Line {location.region.startLine})
                            </h5>
                            <div className="bg-black/50 rounded p-3 font-mono text-sm text-gray-300 overflow-x-auto">
                              <pre>{location.region.snippet.text}</pre>
                            </div>
                          </div>
                        )}

                        {/* Suggested Fixes */}
                        {result.fixes && result.fixes.length > 0 && (
                          <div>
                            <h5 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Suggested Fixes
                            </h5>
                            {result.fixes.map((fix, fixIdx) => (
                              <div key={fixIdx} className="bg-green-900/20 border border-green-500/30 rounded p-3 mb-2">
                                <p className="text-green-400 text-sm mb-2">{fix.description}</p>
                                {fix.artifactChanges.map((change, changeIdx) => (
                                  <div key={changeIdx} className="bg-black/50 rounded p-2 font-mono text-xs text-gray-300">
                                    {change.replacements.map((replacement, repIdx) => (
                                      <div key={repIdx}>
                                        <pre className="text-red-400">- Lines {replacement.deletedRegion.startLine}-{replacement.deletedRegion.endLine}</pre>
                                        <pre className="text-green-400">+ {replacement.insertedContent.text}</pre>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Rule Documentation Link */}
                        <a
                          href={`https://github.com/search?q=${result.ruleId}&type=code`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View rule documentation
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {filteredResults.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No results match your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SARIFViewerDashboard;
