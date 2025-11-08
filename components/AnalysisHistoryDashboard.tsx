import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Clock, Download, Trash2, Eye, Search, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AnalysisRecord {
  id: string;
  filename: string;
  timestamp: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  vulnerabilitiesFound: number;
  analysesRun: string[];
  duration: number;
  status: 'completed' | 'failed' | 'in-progress';
}

interface AnalysisHistoryDashboardProps {
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about' | 'history') => void;
  onViewAnalysis?: (id: string) => void;
}

export const AnalysisHistoryDashboard: React.FC<AnalysisHistoryDashboardProps> = ({ 
  onNavigate,
  onViewAnalysis 
}) => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'severity'>('date');

  useEffect(() => {
    loadAnalyses();
  }, [user]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/analyses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data);
      } else {
        // Fallback to localStorage for now
        const saved = localStorage.getItem('analysis_history');
        if (saved) {
          setAnalyses(JSON.parse(saved));
        } else {
          setAnalyses([]);
        }
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
      // Load from localStorage as fallback
      const saved = localStorage.getItem('analysis_history');
      if (saved) {
        setAnalyses(JSON.parse(saved));
      } else {
        setAnalyses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;
    
    try {
      // TODO: API call
      await fetch(`/api/analyses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setAnalyses(prev => prev.filter(a => a.id !== id));
      
      // Update localStorage
      const updated = analyses.filter(a => a.id !== id);
      localStorage.setItem('analysis_history', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete analysis:', error);
    }
  };

  const exportAnalysis = (analysis: AnalysisRecord) => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${analysis.filename}-${analysis.timestamp}.json`;
    a.click();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-400 bg-red-500/20';
      case 'High': return 'text-orange-400 bg-orange-500/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'Low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const filteredAnalyses = analyses
    .filter(a => 
      (filterSeverity === 'all' || a.severity === filterSeverity) &&
      (searchTerm === '' || a.filename.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      {onNavigate && (
        <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => onNavigate('landing')}
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-blue-400" />
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                      FuzzForge
                    </h1>
                    <p className="text-xs text-gray-400">Analysis History</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-blue-400">{analyses.length}</div>
            <div className="text-sm text-gray-400 mt-1">Total Analyses</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-red-400">
              {analyses.filter(a => a.severity === 'Critical').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Critical Issues</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-orange-400">
              {analyses.filter(a => a.severity === 'High').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">High Priority</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="text-3xl font-bold text-green-400">
              {analyses.filter(a => a.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Completed</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'severity')}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="severity">Sort by Severity</option>
          </select>
        </div>

        {/* Analysis List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading analyses...</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700">
            <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No analyses found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || filterSeverity !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Upload a file to start your first security analysis'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnalyses.map((analysis) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{analysis.filename}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(analysis.severity)}`}>
                        {analysis.severity}
                      </span>
                      {analysis.status === 'in-progress' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400">
                          In Progress
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(analysis.timestamp).toLocaleString()}
                      </div>
                      <div>
                        {analysis.vulnerabilitiesFound} vulnerabilities
                      </div>
                      <div>
                        {analysis.duration}s duration
                      </div>
                      <div>
                        {analysis.analysesRun.length} analyses
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewAnalysis?.(analysis.id)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="View Analysis"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => exportAnalysis(analysis)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Export Analysis"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteAnalysis(analysis.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title="Delete Analysis"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisHistoryDashboard;
