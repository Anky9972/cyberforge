import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { CKGNode, CKGEdge } from '../types';

interface CKGVisualizerProps {
  nodes: CKGNode[];
  edges: CKGEdge[];
}

// Constants for the physics simulation
const REPULSION_STRENGTH = 6000;
const ATTRACTION_STRENGTH = 0.05;
const IDEAL_EDGE_LENGTH = 120;
const DAMPING = 0.95;
const CENTER_GRAVITY = 0.05;
const STOP_THRESHOLD = 0.01;

const CKGVisualizer: React.FC<CKGVisualizerProps> = ({ nodes, edges }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  // Fix: Use lazy initialization for useState to ensure the Map is created only once. This resolves a potential tooling issue and improves performance.
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(() => new Map());

  const velocitiesRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  // Fix: Initialize useRef with null to provide an initial value, resolving the "Expected 1 arguments, but got 0" error.
  const animationFrameRef = useRef<number | null>(null);

  if (nodes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-gray-400 bg-gray-800/50 rounded-2xl border border-gray-700"
      >
        <p>No visual graph to display.</p>
      </motion.div>
    );
  }

  const width = 800;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;

  useEffect(() => {
    // Initialize positions and velocities when nodes change
    const initialPositions = new Map<string, { x: number; y: number }>();
    const initialVelocities = new Map<string, { x: number; y: number }>();
    nodes.forEach(node => {
        initialPositions.set(node.id, {
            x: cx + (Math.random() - 0.5) * 50,
            y: cy + (Math.random() - 0.5) * 50
        });
        initialVelocities.set(node.id, { x: 0, y: 0 });
    });
    setNodePositions(initialPositions);
    velocitiesRef.current = initialVelocities;

    const runSimulation = () => {
        setNodePositions(currentPositions => {
            const positions = new Map(currentPositions);
            const velocities = velocitiesRef.current;
            if (positions.size !== nodes.length) {
                return currentPositions; // State not ready, wait
            }
    
            const forces = new Map<string, { x: number; y: number }>();
            nodes.forEach(node => forces.set(node.id, { x: 0, y: 0 }));
    
            // Repulsion forces
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const nodeA = nodes[i];
                    const nodeB = nodes[j];
                    const posA = positions.get(nodeA.id)!;
                    const posB = positions.get(nodeB.id)!;
                    const dx = posA.x - posB.x;
                    const dy = posA.y - posB.y;
                    let distanceSq = dx * dx + dy * dy;
                    if (distanceSq === 0) distanceSq = 0.1; // prevent division by zero
                    const distance = Math.sqrt(distanceSq);
                    const force = REPULSION_STRENGTH / distanceSq;
                    const forceX = (dx / distance) * force;
                    const forceY = (dy / distance) * force;
                    forces.get(nodeA.id)!.x += forceX;
                    forces.get(nodeA.id)!.y += forceY;
                    forces.get(nodeB.id)!.x -= forceX;
                    forces.get(nodeB.id)!.y -= forceY;
                }
            }
            
            // Attraction forces (edges)
            edges.forEach(edge => {
                const sourcePos = positions.get(edge.source);
                const targetPos = positions.get(edge.target);
                if (!sourcePos || !targetPos) return;
    
                const dx = sourcePos.x - targetPos.x;
                const dy = sourcePos.y - targetPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    const displacement = distance - IDEAL_EDGE_LENGTH;
                    const force = displacement * ATTRACTION_STRENGTH;
                    const forceX = (dx / distance) * force;
                    const forceY = (dy / distance) * force;
        
                    forces.get(edge.source)!.x -= forceX;
                    forces.get(edge.source)!.y -= forceY;
                    forces.get(edge.target)!.x += forceX;
                    forces.get(edge.target)!.y += forceY;
                }
            });
    
            // Center gravity
            nodes.forEach(node => {
                const pos = positions.get(node.id)!;
                const dx = cx - pos.x;
                const dy = cy - pos.y;
                forces.get(node.id)!.x += dx * CENTER_GRAVITY;
                forces.get(node.id)!.y += dy * CENTER_GRAVITY;
            });
            
            let totalMovement = 0;
            const newPositions = new Map<string, { x: number; y: number }>();
    
            nodes.forEach(node => {
                const vel = velocities.get(node.id)!;
                const force = forces.get(node.id)!;
                const pos = positions.get(node.id)!;
                
                vel.x = (vel.x + force.x) * DAMPING;
                vel.y = (vel.y + force.y) * DAMPING;
    
                let newX = pos.x + vel.x;
                let newY = pos.y + vel.y;
                
                // Boundary collision
                if (newX < 50) { newX = 50; vel.x *= -0.5; }
                if (newX > width - 50) { newX = width - 50; vel.x *= -0.5; }
                if (newY < 30) { newY = 30; vel.y *= -0.5; }
                if (newY > height - 30) { newY = height - 30; vel.y *= -0.5; }
    
                newPositions.set(node.id, { x: newX, y: newY });
                totalMovement += Math.abs(vel.x) + Math.abs(vel.y);
            });
    
            if (totalMovement > STOP_THRESHOLD) {
                animationFrameRef.current = requestAnimationFrame(runSimulation);
            }
            return newPositions;
        });
    };

    animationFrameRef.current = requestAnimationFrame(runSimulation);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [nodes, edges]);


  const neighbors = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const connectedNodes = new Set<string>([hoveredNodeId]);
    edges.forEach(edge => {
        if (edge.source === hoveredNodeId) connectedNodes.add(edge.target);
        if (edge.target === hoveredNodeId) connectedNodes.add(edge.source);
    });
    return connectedNodes;
  }, [hoveredNodeId, edges]);

  const getNodeColor = (type: CKGNode['type']) => {
    switch(type) {
      case 'Function': return { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' }; // blue-500
      case 'Class': return { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' }; // purple-500
      case 'File': return { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' }; // emerald-500
      case 'Dependency': return { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' }; // amber-500
      default: return { fill: '#6b7280', glow: 'rgba(107, 114, 128, 0.5)' }; // gray-500
    }
  }

  const truncateLabel = (label: string, maxLength: number = 20) => {
    if (label.length <= maxLength) return label;
    return `${label.substring(0, maxLength)}...`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 mt-6 overflow-hidden shadow-2xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Code Knowledge Graph</h3>
          <p className="text-sm text-gray-400">Interactive visualization of code relationships</p>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-400">Function</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-gray-400">Class</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-400">File</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="rounded-lg">
          <defs>
            {/* Gradient definitions for edges */}
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>

            {/* Glow filters for nodes */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Background grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {edges.map((edge, i) => {
              const sourcePos = nodePositions.get(edge.source);
              const targetPos = nodePositions.get(edge.target);
              if (!sourcePos || !targetPos) return null;

              const isHighlighted = hoveredNodeId && 
                  (neighbors.has(edge.source) && neighbors.has(edge.target));
            
              return (
                <motion.line
                  key={i}
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: i * 0.02 }}
                  className={`transition-all duration-300`}
                  stroke={isHighlighted ? 'url(#edge-gradient)' : '#374151'}
                  strokeWidth={isHighlighted ? "2" : "1"}
                  opacity={hoveredNodeId && !isHighlighted ? 0.1 : 0.6}
                />
              );
          })}

          {/* Nodes */}
          {nodes.map((node, index) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isHighlighted = hoveredNodeId ? neighbors.has(node.id) : false;
            const isFaded = hoveredNodeId ? !isHighlighted : false;
            const isHovered = hoveredNodeId === node.id;
            const radius = isHovered ? 10 : 7;
            const colors = getNodeColor(node.type);

            return (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.03, type: "spring", stiffness: 200 }}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer"
              >
                {/* Outer glow ring for hovered/highlighted nodes */}
                {(isHovered || isHighlighted) && (
                  <motion.circle
                    r={radius + 5}
                    fill="none"
                    stroke={colors.fill}
                    strokeWidth="2"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Node circle */}
                <motion.circle
                  r={radius}
                  fill={colors.fill}
                  filter={isHovered ? "url(#glow)" : undefined}
                  className={`transition-all duration-300`}
                  opacity={isFaded ? 0.2 : 1}
                  animate={isHovered ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                  transition={isHovered ? { duration: 1, repeat: Infinity } : {}}
                />

                {/* Label */}
                <text
                  x={pos.x > cx ? -15 : 15}
                  y="5"
                  textAnchor={pos.x > cx ? 'end' : 'start'}
                  className={`transition-all duration-300 text-sm font-medium pointer-events-none select-none`}
                  fill={isHighlighted || isHovered ? '#f3f4f6' : '#9ca3af'}
                  opacity={isFaded ? 0.2 : 1}
                  fontSize={isHovered ? "14" : "12"}
                >
                    {truncateLabel(node.label)}
                    <title>{node.label}</title>
                </text>

                {/* Type badge for hovered node */}
                {isHovered && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <rect
                      x={-30}
                      y={-30}
                      width="60"
                      height="20"
                      rx="10"
                      fill={colors.fill}
                      fillOpacity="0.9"
                    />
                    <text
                      x="0"
                      y="-16"
                      textAnchor="middle"
                      className="text-xs font-bold pointer-events-none"
                      fill="white"
                    >
                      {node.type}
                    </text>
                  </motion.g>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
      
      {hoveredNodeId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mt-4 p-4 bg-gray-800/50 border border-gray-700 rounded-xl backdrop-blur-sm"
        >
          <p className="text-sm text-gray-300">
            <span className="text-blue-400 font-medium">Tip:</span> Hover over nodes to see connections and relationships in your codebase.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CKGVisualizer;