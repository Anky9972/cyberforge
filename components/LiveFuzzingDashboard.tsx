/**
 * Live Fuzzing Dashboard
 * Features: Real-time coverage growth, exec/sec meter, crash rate graph, corpus size timeline, WebSocket live updates
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Zap, Bug, TrendingUp, Clock, Database,
  Play, Pause, Square, RotateCw, Settings, Download,
  AlertTriangle, CheckCircle, Target, Cpu
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export interface FuzzingMetrics {
  timestamp: number;
  execsPerSec: number;
  totalExecs: number;
  coverage: number;
  corpusSize: number;
  crashes: number;
  hangs: number;
  uniqueCrashes: number;
  pathsFound: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface LiveCrash {
  id: string;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  input: string;
  stackTrace: string;
}

interface LiveFuzzingDashboardProps {
  isRunning?: boolean;
  currentMetrics?: FuzzingMetrics;
  metricsHistory?: FuzzingMetrics[];
  recentCrashes?: LiveCrash[];
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  onExportCorpus?: () => void;
  webSocketUrl?: string;
}

export const LiveFuzzingDashboard: React.FC<LiveFuzzingDashboardProps> = ({
  isRunning = false,
  currentMetrics,
  metricsHistory = [],
  recentCrashes = [],
  onStart,
  onPause,
  onStop,
  onReset,
  onExportCorpus,
  webSocketUrl
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1m' | '5m' | '15m' | 'all'>('5m');
  const [showSystemMetrics, setShowSystemMetrics] = useState(false);
  const [expandedCrash, setExpandedCrash] = useState<string | null>(null);

  // WebSocket connection for live updates
  useEffect(() => {
    if (!webSocketUrl || !isRunning) return;

    const ws = new WebSocket(webSocketUrl);
    
    ws.onopen = () => {
      console.log('Connected to fuzzing engine');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle real-time metric updates
        console.log('Received metrics:', data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [webSocketUrl, isRunning]);

  // Filter metrics by time range
  const getFilteredMetrics = () => {
    if (selectedTimeRange === 'all' || metricsHistory.length === 0) {
      return metricsHistory;
    }

    const now = Date.now();
    const ranges = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
    };

    const cutoff = now - ranges[selectedTimeRange];
    return metricsHistory.filter(m => m.timestamp >= cutoff);
  };

  const filteredMetrics = getFilteredMetrics();

  // Prepare chart data
  const coverageData = filteredMetrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    coverage: m.coverage,
    paths: m.pathsFound,
  }));

  const execData = filteredMetrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    execsPerSec: m.execsPerSec,
  }));

  const corpusData = filteredMetrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    size: m.corpusSize,
  }));

  const crashData = filteredMetrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    total: m.crashes,
    unique: m.uniqueCrashes,
  }));

  const systemData = filteredMetrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    cpu: m.cpuUsage,
    memory: m.memoryUsage,
  }));

  // Current stats
  const currentExecsPerSec = currentMetrics?.execsPerSec || 0;
  const currentCoverage = currentMetrics?.coverage || 0;
  const currentCorpusSize = currentMetrics?.corpusSize || 0;
  const totalCrashes = currentMetrics?.crashes || 0;
  const uniqueCrashes = currentMetrics?.uniqueCrashes || 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
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
              <Activity className="w-8 h-8 text-green-400" />
              Live Fuzzing Monitor
              {isRunning && (
                <span className="flex items-center gap-2 text-lg text-green-400">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  RUNNING
                </span>
              )}
            </h1>
            <p className="text-gray-400 mt-2">
              Real-time fuzzing metrics and crash detection
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={onStart}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2 font-bold"
              >
                <Play className="w-5 h-5" />
                Start Fuzzing
              </button>
            ) : (
              <>
                <button
                  onClick={onPause}
                  className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
                <button
                  onClick={onStop}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <Square className="w-5 h-5" />
                  Stop
                </button>
              </>
            )}
            <button
              onClick={onReset}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
            >
              <RotateCw className="w-5 h-5" />
              Reset
            </button>
            <button
              onClick={onExportCorpus}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </motion.div>

        {/* Real-time Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { 
              label: 'Exec/sec', 
              value: currentExecsPerSec.toFixed(0), 
              icon: Zap, 
              color: 'yellow',
              suffix: '/s'
            },
            { 
              label: 'Coverage', 
              value: `${(currentCoverage * 100).toFixed(1)}%`, 
              icon: Target, 
              color: 'blue',
              suffix: ''
            },
            { 
              label: 'Corpus Size', 
              value: currentCorpusSize, 
              icon: Database, 
              color: 'purple',
              suffix: ' seeds'
            },
            { 
              label: 'Total Crashes', 
              value: totalCrashes, 
              icon: Bug, 
              color: 'red',
              suffix: ''
            },
            { 
              label: 'Unique Crashes', 
              value: uniqueCrashes, 
              icon: AlertTriangle, 
              color: 'orange',
              suffix: ''
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-gradient-to-br from-${stat.color}-900/30 to-${stat.color}-800/30 border border-${stat.color}-500/30 rounded-xl p-4 relative overflow-hidden`}
            >
              {isRunning && (
                <motion.div
                  className={`absolute inset-0 bg-${stat.color}-500/10`}
                  animate={{ opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <stat.icon className={`w-6 h-6 text-${stat.color}-400 mb-2 relative z-10`} />
              <div className={`text-2xl font-bold text-${stat.color}-400 relative z-10`}>
                {stat.value}
                {stat.suffix && <span className="text-sm ml-1">{stat.suffix}</span>}
              </div>
              <div className="text-xs text-gray-400 relative z-10">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 font-medium">Time Range:</span>
          <div className="flex gap-2">
            {(['1m', '5m', '15m', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTimeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSystemMetrics(!showSystemMetrics)}
            className={`ml-auto px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              showSystemMetrics ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            System Metrics
          </button>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coverage Growth */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Coverage Growth
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={coverageData}>
                <defs>
                  <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="coverage" stroke="#3B82F6" fillOpacity={1} fill="url(#coverageGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Execution Speed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Execution Speed
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={execData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" label={{ value: 'exec/s', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="execsPerSec" stroke="#FBBF24" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Corpus Growth */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-400" />
              Corpus Size
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={corpusData}>
                <defs>
                  <linearGradient id="corpusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" label={{ value: 'seeds', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="size" stroke="#8B5CF6" fillOpacity={1} fill="url(#corpusGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Crash Rate */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-400" />
              Crash Discovery
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={crashData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#EF4444" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="unique" stroke="#F59E0B" strokeWidth={2} name="Unique" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* System Metrics */}
        <AnimatePresence>
          {showSystemMetrics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-green-400" />
                System Resource Usage
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={systemData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#10B981" strokeWidth={2} name="CPU" />
                  <Line type="monotone" dataKey="memory" stroke="#3B82F6" strokeWidth={2} name="Memory" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Crashes */}
        {recentCrashes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Recent Crashes ({recentCrashes.length})
            </h3>
            <div className="space-y-3">
              {recentCrashes.slice(0, 10).map((crash) => {
                const isExpanded = expandedCrash === crash.id;
                const severityColors = {
                  critical: 'red',
                  high: 'orange',
                  medium: 'yellow',
                  low: 'blue',
                };
                const color = severityColors[crash.severity];

                return (
                  <div
                    key={crash.id}
                    className="bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-all cursor-pointer"
                    onClick={() => setExpandedCrash(isExpanded ? null : crash.id)}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bug className={`w-5 h-5 text-${color}-400`} />
                        <div>
                          <div className="font-medium text-white">{crash.type}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(crash.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-${color}-900/30 text-${color}-400`}>
                        {crash.severity}
                      </span>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-700 p-4 bg-black/30"
                        >
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-sm font-bold text-gray-400 mb-1">Input</h5>
                              <code className="text-xs text-green-400 font-mono bg-black/50 p-2 rounded block">
                                {crash.input}
                              </code>
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-gray-400 mb-1">Stack Trace</h5>
                              <pre className="text-xs text-gray-300 font-mono bg-black/50 p-2 rounded overflow-x-auto max-h-48">
                                {crash.stackTrace}
                              </pre>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Status Message */}
        {!isRunning && metricsHistory.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No fuzzing session active</p>
            <p className="text-sm mt-2">Click "Start Fuzzing" to begin monitoring</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveFuzzingDashboard;
