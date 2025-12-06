import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { WorkflowStep } from '../types';

interface WorkflowStepperProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  completedSteps?: number[];
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
  completedSteps = []
}) => {
  return (
    <div className="w-full py-6 md:py-10 px-0">
      <div className="max-w-6xl mx-auto">
        {/* Mobile: Horizontal Scroll Container with Gradient Masks */}
        <div className="relative group">
          {/* Fade masks for scroll */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent z-30 pointer-events-none md:hidden"></div>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent z-30 pointer-events-none md:hidden"></div>

          <div className="overflow-x-auto pb-4 px-4 md:px-0 hide-scrollbar scroll-smooth">
            <div className="min-w-[600px] md:min-w-0 relative">

              {/* Progress Background Line */}
              <div className="absolute top-8 left-0 right-0 h-1 bg-gray-800 rounded-full"></div>

              {/* Active Progress Line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: steps.length > 1 ? currentStepIndex / (steps.length - 1) : 0
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute top-8 left-0 h-1 origin-left z-10 rounded-full"
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                }}
              />

              {/* Steps Row */}
              <div className="flex justify-between relative z-20">
                {steps.map((step, index) => {
                  const isCompleted = completedSteps.includes(index) || index < currentStepIndex;
                  const isActive = index === currentStepIndex;
                  const isPending = index > currentStepIndex && !completedSteps.includes(index);
                  const isClickable = onStepClick && (isCompleted || isActive);

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="flex flex-col items-center flex-1"
                      onClick={() => isClickable && onStepClick(index)}
                      style={{ cursor: isClickable ? 'pointer' : 'default' }}
                    >
                      {/* Step Circle Container */}
                      <div className="relative mb-3">
                        {/* Active Glow Ring */}
                        {isActive && (
                          <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-blue-500 rounded-full blur-md"
                          />
                        )}

                        {/* Main Circle */}
                        <div
                          className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-300 ${isCompleted
                              ? 'bg-gray-900 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                              : isActive
                                ? 'bg-gray-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                : 'bg-gray-900 border-gray-700'
                            }`}
                        >
                          {isCompleted ? (
                            <Check className="w-6 h-6 text-blue-400" strokeWidth={3} />
                          ) : (
                            <div className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-500'}`}>
                              {step.icon}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Text Labels */}
                      <div className="text-center">
                        <p className={`text-sm font-bold mb-1 whitespace-nowrap ${isActive ? 'text-white' : isCompleted ? 'text-blue-400' : 'text-gray-500'
                          }`}>
                          {step.name}
                        </p>
                        {/* Mobile-friendly status text instead of badge for cleaner look */}
                        <p className="text-[10px] uppercase tracking-wider font-medium text-gray-500">
                          {isActive ? (
                            <span className="text-blue-400 animate-pulse">In Progress</span>
                          ) : isCompleted ? (
                            <span className="text-green-500">Completed</span>
                          ) : (
                            <span>Pending</span>
                          )}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStepper;
