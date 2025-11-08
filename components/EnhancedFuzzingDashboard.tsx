/**
 * Enhanced Fuzzing Dashboard
 * Showcases all Quick Win features: Crash dedup, Corpus manager, SARIF export, Test generation, API replay
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileCode,
  GitBranch,
  Play,
  Shield,
  TrendingUp,
  Zap,
  Bug,
  Database,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Upload,
  RefreshCw
} from 'lucide-react';

export interface CrashCluster {
  fingerprint: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  firstSeen: Date;
  lastSeen: Date;
  representative: {
    stackTrace: string;
    input: string;
    errorMessage: string;
  };
}

export interface CorpusStats {
  totalSeeds: number;
  goldenSeeds: number;
  avgCoverageScore: number;
  totalExecutions: number;
  uniqueCoverage: number;
  version: number;
}

export interface QuickWinsFeatures {
  crashDedup: {
    enabled: boolean;
    clusters: CrashCluster[];
    deduplicationRate: number;
    stats: {
      totalCrashes: number;
      uniqueCrashes: number;
    };
  };
  corpusManager: {
    enabled: boolean;
    stats: CorpusStats;
    topSeeds: Array<{
      id: string;
      energy: number;
      coverageScore: number;
      isGolden: boolean;
    }>;
  };
  sarifExport: {
    enabled: boolean;
    lastExport?: Date;
    vulnerabilityCount: number;
  };
  testExport: {
    enabled: boolean;
    generatedTests: number;
    frameworks: string[];
  };
  apiReplayer: {
    enabled: boolean;
    sessions: number;
    requestsReplayed: number;
  };
}

interface EnhancedFuzzingDashboardProps {
  features: QuickWinsFeatures;
  onExportSARIF?: () => void;
  onGenerateTests?: (framework: string) => void;
  onPromoteToGolden?: (seedId: string) => void;
  onMinimizeCorpus?: () => void;
  onExportCluster?: (fingerprint: string) => void;
  onImportPostman?: (file: File) => void;
  onReplaySession?: (sessionId: string) => void;
}

export const EnhancedFuzzingDashboard: React.FC<EnhancedFuzzingDashboardProps> = ({
  features,
  onExportSARIF,
  onGenerateTests,
  onPromoteToGolden,
  onMinimizeCorpus,
  onExportCluster,
  onImportPostman,
  onReplaySession
}) => {
  const [activeTab, setActiveTab] = useState<'crashes' | 'corpus' | 'export' | 'replay'>('crashes');
  const [selectedFramework, setSelectedFramework] = useState<string>('jest');

  const tabs = [
    { id: 'crashes' as const, name: 'Crash Deduplication', icon: Bug },
    { id: 'corpus' as const, name: 'Corpus Manager', icon: Database },
    { id: 'export' as const, name: 'Export & CI', icon: GitBranch },
    { id: 'replay' as const, name: 'API Replayer', icon: Play }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30';
      case 'high': return 'text-orange-400 bg-orange-900/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30';
      default: return 'text-blue-400 bg-blue-900/30';
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text mb-2">
                Enhanced Fuzzing Dashboard
              </h1>
              <p className="text-gray-400 text-lg">
                Quick Win Features • Production Ready • Enterprise Grade
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-green-900/30 border border-green-700 rounded-lg">
                <span className="text-green-400 font-semibold">✓ All Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Feature Status Pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { name: 'Crash Dedup', enabled: features.crashDedup.enabled, count: features.crashDedup.stats.uniqueCrashes },
              { name: 'Corpus Manager', enabled: features.corpusManager.enabled, count: features.corpusManager.stats.totalSeeds },
              { name: 'SARIF Export', enabled: features.sarifExport.enabled, count: features.sarifExport.vulnerabilityCount },
              { name: 'Test Gen', enabled: features.testExport.enabled, count: features.testExport.generatedTests },
              { name: 'API Replay', enabled: features.apiReplayer.enabled, count: features.apiReplayer.sessions }
            ].map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`px-4 py-2 rounded-lg border ${
                  feature.enabled
                    ? 'bg-blue-900/30 border-blue-700 text-blue-400'
                    : 'bg-gray-800 border-gray-700 text-gray-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feature.enabled ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  <span className="font-semibold">{feature.name}</span>
                  {feature.enabled && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-700 rounded text-xs">
                      {feature.count}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon size={20} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Crash Deduplication Tab */}
          {activeTab === 'crashes' && (
            <motion.div
              key="crashes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-400">Total Crashes</h3>
                    <Bug className="text-red-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-white">{features.crashDedup.stats.totalCrashes}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-400">Unique Crashes</h3>
                    <Shield className="text-blue-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-white">{features.crashDedup.stats.uniqueCrashes}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-400">Dedup Rate</h3>
                    <TrendingUp className="text-green-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-white">{features.crashDedup.deduplicationRate}%</p>
                </div>
              </div>

              {/* Crash Clusters */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Crash Clusters</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {features.crashDedup.clusters.map((cluster, index) => (
                    <motion.div
                      key={cluster.fingerprint}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-blue-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded text-sm font-semibold ${getSeverityColor(cluster.severity)}`}>
                              {cluster.severity.toUpperCase()}
                            </span>
                            <span className="text-gray-400">Count: {cluster.count}</span>
                            <span className="text-gray-500 text-sm flex items-center gap-1">
                              <Clock size={14} />
                              {new Date(cluster.lastSeen).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 font-mono bg-gray-950 p-2 rounded">
                            {cluster.representative.errorMessage}
                          </p>
                        </div>
                        <button
                          onClick={() => onExportCluster?.(cluster.fingerprint)}
                          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-2"
                        >
                          <Download size={16} />
                          Export
                        </button>
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300 text-sm">
                          View Stack Trace
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-950 rounded text-xs overflow-x-auto">
                          {cluster.representative.stackTrace}
                        </pre>
                      </details>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Corpus Manager Tab */}
          {activeTab === 'corpus' && (
            <motion.div
              key="corpus"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Corpus Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Seeds', value: features.corpusManager.stats.totalSeeds, icon: Database },
                  { label: 'Golden Seeds', value: features.corpusManager.stats.goldenSeeds, icon: Zap },
                  { label: 'Coverage', value: features.corpusManager.stats.uniqueCoverage, icon: Shield },
                  { label: 'Version', value: `v${features.corpusManager.stats.version}`, icon: GitBranch }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-400">{stat.label}</h3>
                      <stat.icon className="text-blue-400" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Corpus Actions */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Corpus Management</h3>
                <div className="flex gap-4">
                  <button
                    onClick={onMinimizeCorpus}
                    className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    Minimize Corpus (Coverage-Aware)
                  </button>
                  <button
                    onClick={() => {/* Export corpus */}}
                    className="px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <Download size={20} />
                    Export
                  </button>
                </div>
              </div>

              {/* Top Seeds */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Top Seeds by Energy</h3>
                <div className="space-y-3">
                  {features.corpusManager.topSeeds.map((seed, index) => (
                    <div
                      key={seed.id}
                      className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-gray-600">#{index + 1}</div>
                        <div>
                          <p className="text-sm text-gray-400">Seed ID: {seed.id.substring(0, 12)}...</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-blue-400">Energy: {seed.energy}</span>
                            <span className="text-green-400">Coverage: {seed.coverageScore}</span>
                            {seed.isGolden && (
                              <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-700 rounded text-yellow-400 text-xs font-semibold">
                                ⭐ GOLDEN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!seed.isGolden && (
                        <button
                          onClick={() => onPromoteToGolden?.(seed.id)}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors text-sm font-semibold"
                        >
                          Promote to Golden
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Export & CI Tab */}
          {activeTab === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* SARIF Export */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <GitBranch className="text-blue-400" />
                  SARIF Export (GitHub Code Scanning)
                </h3>
                <p className="text-gray-400 mb-4">
                  Export findings in SARIF format for GitHub Security tab. Includes CVSS scores, CWE tags, and PoCs.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={onExportSARIF}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    <Download size={20} />
                    Export SARIF Report
                  </button>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 rounded-lg">
                    <FileText className="text-gray-400" size={20} />
                    <span className="text-gray-400">{features.sarifExport.vulnerabilityCount} vulnerabilities</span>
                  </div>
                  {features.sarifExport.lastExport && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 rounded-lg">
                      <Clock className="text-gray-400" size={20} />
                      <span className="text-gray-400">
                        Last: {new Date(features.sarifExport.lastExport).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Generation */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <FileCode className="text-green-400" />
                  Property-Based Test Generation
                </h3>
                <p className="text-gray-400 mb-4">
                  Generate regression tests from minimized crashing inputs for your testing framework.
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {['jest', 'pytest', 'junit', 'mocha', 'go'].map((framework) => (
                    <button
                      key={framework}
                      onClick={() => setSelectedFramework(framework)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        selectedFramework === framework
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {framework}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => onGenerateTests?.(selectedFramework)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <FileCode size={20} />
                  Generate {selectedFramework} Tests
                </button>
                <p className="mt-4 text-sm text-gray-500">
                  {features.testExport.generatedTests} tests generated across {features.testExport.frameworks.length} frameworks
                </p>
              </div>

              {/* GitHub Actions Workflow */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">GitHub Actions Workflow</h3>
                <p className="text-gray-400 mb-4">
                  Add automated fuzzing to your CI/CD pipeline with inline PR comments.
                </p>
                <button
                  onClick={() => {/* Download workflow */}}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Download size={20} />
                  Download Workflow YAML
                </button>
              </div>
            </motion.div>
          )}

          {/* API Replayer Tab */}
          {activeTab === 'replay' && (
            <motion.div
              key="replay"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Import Section */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Upload className="text-blue-400" />
                  Import API Traffic
                </h3>
                <p className="text-gray-400 mb-4">
                  Import Postman collections or HAR files to replay and fuzz API requests.
                </p>
                <div className="flex gap-4">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".json,.har"
                      onChange={(e) => e.target.files?.[0] && onImportPostman?.(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-center cursor-pointer">
                      Import Postman Collection
                    </div>
                  </label>
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".har"
                      onChange={(e) => e.target.files?.[0] && onImportPostman?.(e.target.files[0])}
                      className="hidden"
                    />
                    <div className="px-6 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors text-center cursor-pointer">
                      Import HAR File
                    </div>
                  </label>
                </div>
              </div>

              {/* Session Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-400">Active Sessions</h3>
                    <Play className="text-green-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-white">{features.apiReplayer.sessions}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-400">Requests Replayed</h3>
                    <TrendingUp className="text-blue-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-white">{features.apiReplayer.requestsReplayed}</p>
                </div>
              </div>

              {/* Features */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Supported Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'OAuth2 Token Management', desc: 'Auto-refresh expired tokens' },
                    { name: 'JWT Handling', desc: 'Capture and replay JWTs' },
                    { name: 'Session Tracking', desc: 'Maintain stateful sessions' },
                    { name: 'Request Mutation', desc: 'Fuzz headers, body, and params' },
                    { name: 'Variable Extraction', desc: 'Capture IDs and tokens' },
                    { name: 'Sequence Testing', desc: 'Test API call sequences' }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-900 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <h4 className="font-semibold text-white mb-1">{feature.name}</h4>
                          <p className="text-sm text-gray-400">{feature.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedFuzzingDashboard;
