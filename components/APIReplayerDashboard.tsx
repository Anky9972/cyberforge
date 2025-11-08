/**
 * API Replayer Dashboard
 * Features: Request sequence viewer, mutation controls, OAuth flow visualizer, HAR/Postman import
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipForward, Upload, Download, Settings, 
  Zap, Lock, Key, RefreshCw, CheckCircle, XCircle,
  Globe, Clock, TrendingUp, AlertTriangle, ChevronRight, ChevronDown
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export interface HTTPRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string | object;
  timestamp: number;
  auth?: {
    type: 'bearer' | 'basic' | 'oauth2' | 'api-key';
    token?: string;
  };
}

export interface HTTPResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

export interface ReplaySession {
  id: string;
  name: string;
  requests: HTTPRequest[];
  baseUrl: string;
  createdAt: Date;
}

export interface MutationResult {
  requestId: string;
  mutations: number;
  vulnerabilities: number;
  crashes: number;
  anomalies: number;
}

interface APIReplayerDashboardProps {
  sessions: ReplaySession[];
  activeSession?: ReplaySession;
  replayResults?: Map<string, { request: HTTPRequest; response: HTTPResponse; result: 'success' | 'error' | 'anomaly' }>;
  mutationResults?: MutationResult[];
  onImportHAR?: (file: File) => void;
  onImportPostman?: (file: File) => void;
  onStartReplay?: (sessionId: string, options: any) => void;
  onStopReplay?: () => void;
  onMutateRequest?: (requestId: string, strategy: string) => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#10B981',
  POST: '#3B82F6',
  PUT: '#F59E0B',
  DELETE: '#EF4444',
  PATCH: '#8B5CF6',
};

const MUTATION_STRATEGIES = [
  { id: 'headers', name: 'Header Fuzzing', description: 'Inject malicious headers', icon: '🎯' },
  { id: 'body', name: 'Body Mutation', description: 'Mutate request payloads', icon: '📦' },
  { id: 'params', name: 'Parameter Fuzzing', description: 'Test query parameters', icon: '🔍' },
  { id: 'auth', name: 'Auth Bypass', description: 'Test authorization', icon: '🔓' },
  { id: 'sequence', name: 'Sequence Fuzzing', description: 'Test request ordering', icon: '🔄' },
];

export const APIReplayerDashboard: React.FC<APIReplayerDashboardProps> = ({
  sessions,
  activeSession,
  replayResults,
  mutationResults,
  onImportHAR,
  onImportPostman,
  onStartReplay,
  onStopReplay,
  onMutateRequest
}) => {
  const [selectedSession, setSelectedSession] = useState<string | null>(activeSession?.id || null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['headers', 'body']);
  const [mutationIntensity, setMutationIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [showOAuthFlow, setShowOAuthFlow] = useState(false);

  const currentSession = sessions.find(s => s.id === selectedSession);

  // Calculate stats
  const totalRequests = currentSession?.requests.length || 0;
  const successCount = replayResults ? Array.from(replayResults.values()).filter(r => r.result === 'success').length : 0;
  const errorCount = replayResults ? Array.from(replayResults.values()).filter(r => r.result === 'error').length : 0;
  const anomalyCount = replayResults ? Array.from(replayResults.values()).filter(r => r.result === 'anomaly').length : 0;

  const totalMutations = mutationResults?.reduce((sum, r) => sum + r.mutations, 0) || 0;
  const totalVulns = mutationResults?.reduce((sum, r) => sum + r.vulnerabilities, 0) || 0;

  // Prepare chart data
  const methodDistribution = currentSession?.requests.reduce((acc, req) => {
    acc[req.method] = (acc[req.method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const methodData = methodDistribution ? Object.entries(methodDistribution).map(([method, count]) => ({
    name: method,
    value: count,
    color: METHOD_COLORS[method] || '#6B7280'
  })) : [];

  const responseTimeData = replayResults ? Array.from(replayResults.values()).map((r, i) => ({
    name: `Req ${i + 1}`,
    duration: r.response.duration,
    status: r.response.status
  })) : [];

  const mutationData = mutationResults?.map(r => ({
    name: r.requestId.substring(0, 8),
    vulnerabilities: r.vulnerabilities,
    anomalies: r.anomalies
  })) || [];

  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategies(prev =>
      prev.includes(strategyId)
        ? prev.filter(s => s !== strategyId)
        : [...prev, strategyId]
    );
  };

  const handleStartReplay = () => {
    if (!selectedSession || !onStartReplay) return;
    setIsReplaying(true);
    onStartReplay(selectedSession, {
      strategies: selectedStrategies,
      intensity: mutationIntensity,
    });
  };

  const handleStopReplay = () => {
    setIsReplaying(false);
    onStopReplay?.();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-blue-400">{`Value: ${payload[0].value}`}</p>
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
              <Globe className="w-8 h-8 text-blue-400" />
              API Traffic Replayer
            </h1>
            <p className="text-gray-400 mt-2">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} • {totalRequests} requests
            </p>
          </div>

          {/* Import Buttons */}
          <div className="flex gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".har"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onImportHAR?.(e.target.files[0])}
              />
              <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import HAR
              </div>
            </label>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onImportPostman?.(e.target.files[0])}
              />
              <div className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import Postman
              </div>
            </label>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Requests', value: totalRequests, icon: Globe, color: 'blue' },
            { label: 'Success', value: successCount, icon: CheckCircle, color: 'green' },
            { label: 'Errors', value: errorCount, icon: XCircle, color: 'red' },
            { label: 'Anomalies', value: anomalyCount, icon: AlertTriangle, color: 'yellow' },
            { label: 'Vulnerabilities', value: totalVulns, icon: Zap, color: 'orange' },
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

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Method Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              HTTP Method Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={methodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {methodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Response Times */}
          {responseTimeData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Response Times
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="duration" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Mutation Strategies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-400" />
            Mutation Strategies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {MUTATION_STRATEGIES.map((strategy) => (
              <motion.button
                key={strategy.id}
                onClick={() => toggleStrategy(strategy.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedStrategies.includes(strategy.id)
                    ? 'border-orange-500 bg-orange-900/30'
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-2">{strategy.icon}</div>
                <div className="font-bold text-white text-sm">{strategy.name}</div>
                <div className="text-xs text-gray-400 mt-1">{strategy.description}</div>
              </motion.button>
            ))}
          </div>

          {/* Intensity Selector */}
          <div className="flex items-center gap-4">
            <span className="text-gray-400 font-medium">Mutation Intensity:</span>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setMutationIntensity(level)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    mutationIntensity === level
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Replay Control</h3>
              <p className="text-sm text-gray-400">
                {isReplaying ? 'Replay in progress...' : 'Ready to start replay'}
              </p>
            </div>
            <div className="flex gap-3">
              {!isReplaying ? (
                <button
                  onClick={handleStartReplay}
                  disabled={!selectedSession}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2 text-lg font-bold"
                >
                  <Play className="w-5 h-5" />
                  Start Replay & Fuzz
                </button>
              ) : (
                <button
                  onClick={handleStopReplay}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2 text-lg font-bold"
                >
                  <Pause className="w-5 h-5" />
                  Stop Replay
                </button>
              )}
              <button
                onClick={() => setShowOAuthFlow(!showOAuthFlow)}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
              >
                <Lock className="w-5 h-5" />
                OAuth Flow
              </button>
            </div>
          </div>
        </motion.div>

        {/* OAuth Flow Visualizer */}
        <AnimatePresence>
          {showOAuthFlow && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-400" />
                OAuth2 Flow Tracker
              </h3>
              <div className="space-y-3">
                {[
                  { step: 1, name: 'Authorization Request', status: 'complete', token: 'auth_code_xyz' },
                  { step: 2, name: 'Token Exchange', status: 'complete', token: 'access_token_abc' },
                  { step: 3, name: 'API Access', status: 'active', token: 'Bearer abc...' },
                  { step: 4, name: 'Token Refresh', status: 'pending', token: 'refresh_token_def' },
                ].map((flow) => (
                  <div key={flow.step} className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      flow.status === 'complete' ? 'bg-green-500 text-white' :
                      flow.status === 'active' ? 'bg-blue-500 text-white' :
                      'bg-gray-600 text-gray-400'
                    }`}>
                      {flow.step}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{flow.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{flow.token}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      flow.status === 'complete' ? 'bg-green-900/30 text-green-400' :
                      flow.status === 'active' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {flow.status}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Requests List */}
        {currentSession && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Request Sequence ({currentSession.requests.length})
            </h3>

            {currentSession.requests.map((request, index) => {
              const isExpanded = expandedRequest === request.id;
              const result = replayResults?.get(request.id);

              return (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                        <span
                          className="px-3 py-1 rounded font-bold text-sm"
                          style={{ backgroundColor: `${METHOD_COLORS[request.method]}20`, color: METHOD_COLORS[request.method] }}
                        >
                          {request.method}
                        </span>
                        <span className="text-white font-mono text-sm truncate">{request.url}</span>
                        {result && (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            result.result === 'success' ? 'bg-green-900/30 text-green-400' :
                            result.result === 'error' ? 'bg-red-900/30 text-red-400' :
                            'bg-yellow-900/30 text-yellow-400'
                          }`}>
                            {result.response.status}
                          </span>
                        )}
                        {request.auth && (
                          <span className="flex items-center gap-1 text-xs text-blue-400">
                            <Lock className="w-3 h-3" />
                            {request.auth.type}
                          </span>
                        )}
                      </div>
                      {result && (
                        <div className="text-sm text-gray-400">
                          {result.response.duration}ms
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Request Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-700"
                      >
                        <div className="p-4 bg-gray-900/50 space-y-3">
                          <div>
                            <h5 className="text-sm font-bold text-gray-400 mb-2">Headers</h5>
                            <div className="bg-black/50 rounded p-3 font-mono text-xs text-gray-300">
                              {Object.entries(request.headers).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-blue-400">{key}:</span> {value}
                                </div>
                              ))}
                            </div>
                          </div>
                          {request.body && (
                            <div>
                              <h5 className="text-sm font-bold text-gray-400 mb-2">Body</h5>
                              <div className="bg-black/50 rounded p-3 font-mono text-xs text-gray-300">
                                {typeof request.body === 'string' ? request.body : JSON.stringify(request.body, null, 2)}
                              </div>
                            </div>
                          )}
                          {result && (
                            <div>
                              <h5 className="text-sm font-bold text-gray-400 mb-2">Response</h5>
                              <div className="bg-black/50 rounded p-3 font-mono text-xs text-gray-300 max-h-48 overflow-y-auto">
                                {result.response.body}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {sessions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No replay sessions available</p>
            <p className="text-sm mt-2">Import HAR or Postman collection to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIReplayerDashboard;
