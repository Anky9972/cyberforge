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
  Settings,
  MessageSquare
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { CollaborationPanel } from './CollaborationPanel';

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
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'crashes' | 'corpus' | 'export' | 'replay'>('crashes');
  const [selectedFramework, setSelectedFramework] = useState<string>('jest');
  const [customizationMode, setCustomizationMode] = useState(false);
  const [collaborationOpenId, setCollaborationOpenId] = useState<string | null>(null);

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
    <div className={`min-h-screen p-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
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
              <button
                onClick={toggleTheme}
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? '🌞' : '🌙'}
              </button>
              <button
                onClick={() => setCustomizationMode(!customizationMode)}
                className={`p-2 rounded-lg transition-colors ${customizationMode ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                title="Customize Dashboard"
              >
                <Settings size={20} />
              </button>
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
              { name: 'API Replay', enabled: features.apiReplayer.enabled, count: features.apiReplayer.requestsReplayed }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: customizationMode ? 1.05 : 1.02, cursor: customizationMode ? 'grab' : 'default' }}
                className={`flex items-center gap-3 px-4 py-2 rounded-full border ${feature.enabled
                  ? 'bg-blue-900/20 border-blue-500/30'
                  : 'bg-gray-800/50 border-gray-700'
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${feature.enabled ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className="font-medium text-sm">{feature.name}</span>
                {feature.enabled && (
                  <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded-full">
                    {feature.count}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              <tab.icon size={18} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'crashes' && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  {features.crashDedup.clusters.map((cluster) => (
                    <motion.div
                      key={cluster.fingerprint}
                      layout={customizationMode}
                      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getSeverityColor(cluster.severity)}`}>
                            {cluster.severity}
                          </span>
                          <span className="font-mono text-gray-400 text-sm">
                            {cluster.fingerprint.substring(0, 8)}...
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-gray-400 text-sm">
                          <Clock size={14} />
                          {new Date(cluster.lastSeen).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="bg-black/50 rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
                        <div className="text-red-400 mb-2">{cluster.representative.errorMessage}</div>
                        <div className="text-gray-500 pl-4 border-l-2 border-gray-700">
                          {cluster.representative.stackTrace.split('\n').slice(0, 3).join('\n')}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <TrendingUp size={16} className="text-blue-400" />
                          <span>Seen {cluster.count} times</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCollaborationOpenId(
                              collaborationOpenId === cluster.fingerprint ? null : cluster.fingerprint
                            )}
                            className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors ${collaborationOpenId === cluster.fingerprint
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-white'
                              }`}
                          >
                            <MessageSquare size={14} />
                            {collaborationOpenId === cluster.fingerprint ? 'Close' : 'Discuss'}
                          </button>
                          <button
                            onClick={() => onExportCluster?.(cluster.fingerprint)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium px-3 py-1.5"
                          >
                            Export Repro
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {collaborationOpenId === cluster.fingerprint && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <CollaborationPanel
                              crashesFingerprint={cluster.fingerprint}
                              onClose={() => setCollaborationOpenId(null)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                <div className="md:col-span-1 space-y-6">
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Shield className="text-green-400" />
                      Deduplication Stats
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                        <span className="text-gray-400">Total Crashes</span>
                        <span className="text-2xl font-bold">{features.crashDedup.stats.totalCrashes}</span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg">
                        <span className="text-gray-400">Unique Clusters</span>
                        <span className="text-2xl font-bold text-blue-400">{features.crashDedup.stats.uniqueCrashes}</span>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Efficiency Rate</span>
                          <span className="text-green-400 font-bold">{features.crashDedup.deduplicationRate}%</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                            style={{ width: `${features.crashDedup.deduplicationRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'corpus' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Database className="text-blue-400" />
                    Corpus Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Seeds</span>
                      <span className="font-bold">{features.corpusManager.stats.totalSeeds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Golden Seeds</span>
                      <span className="font-bold text-yellow-400">{features.corpusManager.stats.goldenSeeds}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Coverage</span>
                      <span className="font-bold text-green-400">{features.corpusManager.stats.avgCoverageScore.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4">Top Performing Seeds</h3>
                  <div className="space-y-3">
                    {features.corpusManager.topSeeds.map(seed => (
                      <div key={seed.id} className="flex justify-between items-center bg-gray-900/50 p-3 rounded">
                        <span className="font-mono text-sm text-gray-300">{seed.id.substring(0, 8)}</span>
                        <div className="flex gap-3 text-sm">
                          <span className="text-blue-400">Cov: {seed.coverageScore}%</span>
                          <span className="text-yellow-400">⚡ {seed.energy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <GitBranch className="text-purple-400" />
                    SARIF Export
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Export findings in SARIF 2.1.0 format for integration with GitHub Code Scanning.
                  </p>
                  <button
                    onClick={onExportSARIF}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download size={20} />
                    Download SARIF Report
                  </button>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    {features.sarifExport.vulnerabilityCount} vulnerabilities ready to export
                  </div>

                  <div className="mt-6 border-t border-gray-700 pt-6">
                    <h4 className="font-semibold text-sm text-gray-400 mb-3 uppercase tracking-wider">Reports & Compliance</h4>
                    <button
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mb-2"
                    >
                      <FileText size={20} className="text-blue-400" />
                      Download Executive Summary
                    </button>
                    <button
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Shield size={20} className="text-green-400" />
                      View ISO 27001 Compliance Map
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <FileCode className="text-blue-400" />
                    Test Generation
                  </h3>
                  <div className="flex gap-2 mb-6">
                    {['jest', 'pytest', 'junit', 'mocha', 'go'].map(fw => (
                      <button
                        key={fw}
                        onClick={() => setSelectedFramework(fw)}
                        className={`px-3 py-1 rounded text-sm uppercase ${selectedFramework === fw
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                          }`}
                      >
                        {fw}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => onGenerateTests?.(selectedFramework)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Zap size={20} />
                    Generate Regression Tests
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'replay' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Play className="text-orange-400" />
                    API Session Replay
                  </h3>
                  <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-orange-500/50 transition-colors">
                    <Upload className="mx-auto text-gray-500 mb-4" size={32} />
                    <p className="text-gray-300 font-medium mb-2">Drop Postman Collection or HAR file</p>
                    <p className="text-sm text-gray-500 mb-4">Supports OAuth2 auto-refresh tokens</p>
                    <input
                      type="file"
                      className="hidden"
                      id="api-import"
                      onChange={(e) => e.target.files?.[0] && onImportPostman?.(e.target.files[0])}
                    />
                    <label
                      htmlFor="api-import"
                      className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Select File
                    </label>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedFuzzingDashboard;
