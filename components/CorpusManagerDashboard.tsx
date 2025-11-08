/**
 * Corpus Manager Dashboard
 * Features: Seed management, evolution timeline, coverage heatmap, promote to golden seed
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Star, TrendingUp, Upload, Download, Trash2, 
  CheckCircle, Clock, Zap, Target, Filter, Search
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, Cell
} from 'recharts';

export interface Seed {
  id: string;
  content: string;
  hash: string;
  addedAt: Date;
  lastUsed: Date;
  executionCount: number;
  coverageScore: number;
  crashCount: number;
  energy: number;
  isGolden: boolean;
  metadata: {
    source: 'manual' | 'generated' | 'minimized' | 'mutated';
    parentId?: string;
    tags?: string[];
    size: number;
  };
}

interface CorpusManagerDashboardProps {
  targetId: string;
  seeds: Seed[];
  onPromoteToGolden?: (seedId: string) => void;
  onRemoveSeed?: (seedId: string) => void;
  onUploadSeed?: (file: File) => void;
  onDownloadCorpus?: () => void;
  evolutionHistory?: Array<{
    generation: number;
    timestamp: Date;
    newCoverage: number;
    seedsAdded: number;
    seedsPruned: number;
    avgEnergy: number;
  }>;
}

export const CorpusManagerDashboard: React.FC<CorpusManagerDashboardProps> = ({
  targetId,
  seeds,
  onPromoteToGolden,
  onRemoveSeed,
  onUploadSeed,
  onDownloadCorpus,
  evolutionHistory
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterGolden, setFilterGolden] = useState<boolean | 'all'>('all');
  const [sortBy, setSortBy] = useState<'coverage' | 'crashes' | 'energy' | 'recent'>('coverage');

  // Calculate stats
  const totalSeeds = seeds.length;
  const goldenSeeds = seeds.filter(s => s.isGolden).length;
  const avgCoverage = seeds.reduce((sum, s) => sum + s.coverageScore, 0) / totalSeeds || 0;
  const totalCrashes = seeds.reduce((sum, s) => sum + s.crashCount, 0);
  const totalExecutions = seeds.reduce((sum, s) => sum + s.executionCount, 0);

  // Prepare chart data
  const evolutionData = evolutionHistory || Array.from({ length: 10 }, (_, i) => ({
    generation: i + 1,
    timestamp: new Date(Date.now() - (10 - i) * 3600000),
    newCoverage: 50 + Math.random() * 30 + i * 2,
    seedsAdded: Math.floor(Math.random() * 20) + 5,
    seedsPruned: Math.floor(Math.random() * 10),
    avgEnergy: 60 + Math.random() * 30
  }));

  const coverageDistribution = seeds.map(s => ({
    name: s.id.substring(0, 8),
    coverage: s.coverageScore,
    crashes: s.crashCount,
    energy: s.energy,
    isGolden: s.isGolden
  }));

  const sourceDistribution = [
    { name: 'Manual', value: seeds.filter(s => s.metadata.source === 'manual').length, color: '#3B82F6' },
    { name: 'Generated', value: seeds.filter(s => s.metadata.source === 'generated').length, color: '#10B981' },
    { name: 'Minimized', value: seeds.filter(s => s.metadata.source === 'minimized').length, color: '#F59E0B' },
    { name: 'Mutated', value: seeds.filter(s => s.metadata.source === 'mutated').length, color: '#8B5CF6' },
  ];

  // Filter and sort seeds
  let filteredSeeds = seeds.filter(seed => {
    const matchesSearch = !searchTerm || 
      seed.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seed.metadata.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSource = filterSource === 'all' || seed.metadata.source === filterSource;
    const matchesGolden = filterGolden === 'all' || seed.isGolden === filterGolden;
    return matchesSearch && matchesSource && matchesGolden;
  });

  // Sort seeds
  filteredSeeds = [...filteredSeeds].sort((a, b) => {
    switch (sortBy) {
      case 'coverage': return b.coverageScore - a.coverageScore;
      case 'crashes': return b.crashCount - a.crashCount;
      case 'energy': return b.energy - a.energy;
      case 'recent': return b.lastUsed.getTime() - a.lastUsed.getTime();
      default: return 0;
    }
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold">{payload[0].name || 'Value'}</p>
          <p className="text-blue-400">{`${payload[0].value}`}</p>
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
              <Database className="w-8 h-8 text-blue-400" />
              Corpus Manager
            </h1>
            <p className="text-gray-400 mt-2">
              Target: <span className="font-mono text-gray-300">{targetId}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onUploadSeed?.(e.target.files[0])}
              />
              <div className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Seed
              </div>
            </label>
            <button
              onClick={onDownloadCorpus}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Corpus
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Seeds', value: totalSeeds, icon: Database, color: 'blue' },
            { label: 'Golden Seeds', value: goldenSeeds, icon: Star, color: 'yellow' },
            { label: 'Avg Coverage', value: `${avgCoverage.toFixed(1)}%`, icon: Target, color: 'green' },
            { label: 'Total Crashes', value: totalCrashes, icon: Zap, color: 'red' },
            { label: 'Executions', value: totalExecutions.toLocaleString(), icon: TrendingUp, color: 'purple' },
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

        {/* Evolution Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Seed Evolution Timeline
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="generation" stroke="#9CA3AF" label={{ value: 'Generation', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="newCoverage" stroke="#10B981" fillOpacity={1} fill="url(#colorCoverage)" name="Coverage %" />
              <Line type="monotone" dataKey="seedsAdded" stroke="#3B82F6" strokeWidth={2} name="Seeds Added" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Coverage Scatter Plot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Coverage vs Crashes (Seed Quality)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number" 
                dataKey="coverage" 
                name="Coverage" 
                stroke="#9CA3AF"
                label={{ value: 'Coverage Score', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="crashes" 
                name="Crashes" 
                stroke="#9CA3AF"
                label={{ value: 'Crashes Found', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
              <Scatter name="Seeds" data={coverageDistribution} fill="#3B82F6">
                {coverageDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isGolden ? '#FBBF24' : '#3B82F6'}
                    r={entry.isGolden ? 8 : 5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400"></div>
              <span>Regular Seeds</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
              <span>Golden Seeds</span>
            </div>
          </div>
        </motion.div>

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
              placeholder="Search seeds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual</option>
              <option value="generated">Generated</option>
              <option value="minimized">Minimized</option>
              <option value="mutated">Mutated</option>
            </select>

            <select
              value={filterGolden === 'all' ? 'all' : filterGolden ? 'golden' : 'regular'}
              onChange={(e) => setFilterGolden(e.target.value === 'all' ? 'all' : e.target.value === 'golden')}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Seeds</option>
              <option value="golden">Golden Only</option>
              <option value="regular">Regular Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="coverage">Sort by Coverage</option>
              <option value="crashes">Sort by Crashes</option>
              <option value="energy">Sort by Energy</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </motion.div>

        {/* Seeds List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredSeeds.map((seed, index) => (
            <motion.div
              key={seed.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`bg-gray-800/50 rounded-xl p-4 border ${
                seed.isGolden ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'border-gray-700'
              } hover:border-gray-600 transition-all`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {seed.isGolden && <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />}
                    <h4 className="font-mono text-sm text-white">{seed.id}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      seed.metadata.source === 'manual' ? 'bg-blue-900/30 text-blue-400' :
                      seed.metadata.source === 'generated' ? 'bg-green-900/30 text-green-400' :
                      seed.metadata.source === 'minimized' ? 'bg-orange-900/30 text-orange-400' :
                      'bg-purple-900/30 text-purple-400'
                    }`}>
                      {seed.metadata.source}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Coverage:</span>
                      <span className="text-green-400 font-bold ml-2">{seed.coverageScore.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Crashes:</span>
                      <span className="text-red-400 font-bold ml-2">{seed.crashCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Energy:</span>
                      <span className="text-blue-400 font-bold ml-2">{seed.energy.toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Execs:</span>
                      <span className="text-purple-400 font-bold ml-2">{seed.executionCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Size:</span>
                      <span className="text-gray-300 font-bold ml-2">{seed.metadata.size} bytes</span>
                    </div>
                  </div>

                  {seed.metadata.tags && seed.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {seed.metadata.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!seed.isGolden && onPromoteToGolden && (
                    <button
                      onClick={() => onPromoteToGolden(seed.id)}
                      className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all"
                      title="Promote to Golden"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  {onRemoveSeed && (
                    <button
                      onClick={() => onRemoveSeed(seed.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                      title="Remove Seed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredSeeds.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No seeds found matching your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorpusManagerDashboard;
