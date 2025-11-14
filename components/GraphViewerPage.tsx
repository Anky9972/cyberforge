import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CKGVisualizer from './CKGVisualizer';
import type { CKGNode, CKGEdge } from '../types';

export const GraphViewerPage: React.FC = () => {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState<{ nodes: CKGNode[]; edges: CKGEdge[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeType, setSelectedNodeType] = useState<string>('all');

  useEffect(() => {
    // Retrieve graph data from sessionStorage
    const data = sessionStorage.getItem('ckgData');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setGraphData(parsed);
      } catch (error) {
        console.error('Failed to parse graph data:', error);
      }
    }
  }, []);

  if (!graphData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Graph Data Found</h1>
          <p className="text-gray-400 mb-6">Please analyze a codebase first</p>
          <button
            onClick={() => navigate('/analyze')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Analysis
          </button>
        </div>
      </div>
    );
  }

  // Filter nodes based on search and type
  const filteredNodes = graphData.nodes.filter(node => {
    const matchesSearch = searchTerm === '' || 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedNodeType === 'all' || node.type === selectedNodeType;
    
    return matchesSearch && matchesType;
  });

  // Filter edges to only include edges between filtered nodes
  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = graphData.edges.filter(
    edge => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
  );

  const nodeTypes = ['all', ...Array.from(new Set(graphData.nodes.map(n => n.type)))];
  
  const stats = {
    totalNodes: graphData.nodes.length,
    totalEdges: graphData.edges.length,
    functions: graphData.nodes.filter(n => n.type === 'Function').length,
    classes: graphData.nodes.filter(n => n.type === 'Class').length,
    files: graphData.nodes.filter(n => n.type === 'File').length,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">Interactive Code Knowledge Graph</h1>
                <p className="text-sm text-gray-400">AST-powered visualization of code structure</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.functions}</div>
                <div className="text-gray-400">Functions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.classes}</div>
                <div className="text-gray-400">Classes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.files}</div>
                <div className="text-gray-400">Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.totalEdges}</div>
                <div className="text-gray-400">Connections</div>
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="mt-4 flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search nodes by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Filter */}
            <select
              value={selectedNodeType}
              onChange={(e) => setSelectedNodeType(e.target.value)}
              className="px-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {nodeTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
            
            {/* Reset */}
            {(searchTerm || selectedNodeType !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedNodeType('all');
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Filter status */}
          {(searchTerm || selectedNodeType !== 'all') && (
            <div className="mt-2 text-sm text-gray-400">
              Showing {filteredNodes.length} of {stats.totalNodes} nodes
              {filteredEdges.length !== stats.totalEdges && ` (${filteredEdges.length} connections)`}
            </div>
          )}
        </div>
      </header>

      {/* Graph Container */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <CKGVisualizer 
            nodes={filteredNodes} 
            edges={filteredEdges}
            forceRender={true}
          />
        </motion.div>
        
        {/* Legend */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold mb-3">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">Function</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm">Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">File</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Dependency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">Endpoint</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GraphViewerPage;
