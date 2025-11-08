
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
// Fix: Correct import path for types
import type { WorkflowStep } from '../types';

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ steps, currentStepIndex }) => {
  return (
    <div className="w-full py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Steps Container */}
        <div className="relative">
          {/* Progress line background */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-700/50"></div>
          
          {/* Animated progress line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ 
              scaleX: currentStepIndex > 0 ? currentStepIndex / (steps.length - 1) : 0 
            }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute top-8 left-0 h-0.5 origin-left z-10"
            style={{ 
              width: '100%',
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)'
            }}
          />

          {/* Steps Grid */}
          <div className="grid gap-4" style={{ 
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` 
          }}>
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex flex-col items-center relative z-20"
                >
                  {/* Step Circle */}
                  <motion.div
                    animate={isActive ? {
                      scale: [1, 1.08, 1],
                    } : {}}
                    transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                    className="relative mb-4"
                  >
                    {/* Outer glow ring for active step */}
                    {isActive && (
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.6, 0, 0.6]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                          filter: 'blur(8px)'
                        }}
                      />
                    )}

                    {/* Step circle */}
                    <div
                      className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-blue-600 to-cyan-600 border-blue-400 shadow-lg shadow-blue-500/40' 
                          : isActive 
                          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400 shadow-lg shadow-blue-500/30 backdrop-blur-sm' 
                          : 'bg-gray-800/80 border-gray-600/50'
                      }`}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                          <Check className="w-7 h-7 text-white drop-shadow-lg" />
                        </motion.div>
                      ) : (
                        <div className={`transform transition-all duration-300 ${
                          isActive ? 'text-blue-400 scale-110' : 'text-gray-500 scale-100'
                        }`}>
                          {step.icon}
                        </div>
                      )}
                    </div>

                    {/* Pulsing dot for active step */}
                    {isActive && (
                      <motion.div
                        animate={{
                          scale: [0, 1.5],
                          opacity: [0.8, 0]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                        className="absolute inset-0 rounded-full bg-blue-500"
                      />
                    )}
                  </motion.div>

                  {/* Step Label */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="text-center"
                  >
                    <p className={`text-sm font-semibold mb-1 transition-colors duration-300 ${
                      isCompleted 
                        ? 'text-blue-400' 
                        : isActive 
                        ? 'text-blue-400' 
                        : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>

                    {/* Status Badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                          <Check className="w-3 h-3" />
                          Complete
                        </span>
                      )}
                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-2 h-2 border-2 border-blue-400 border-t-transparent rounded-full"
                          />
                          Active
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-700/30 border border-gray-600/30 rounded-full text-xs text-gray-500">
                          Pending
                        </span>
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStepper;

