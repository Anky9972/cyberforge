import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Square } from 'lucide-react';

interface AnalysisOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommended: boolean;
}

interface AnalysisOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedOptions: string[]) => void;
  currentSelections: string[];
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    id: 'recon',
    name: 'Static & Reconnaissance',
    description: 'Detect hardcoded secrets, exposed paths, and insecure configurations',
    icon: '🔍',
    recommended: true
  },
  {
    id: 'api-security',
    name: 'API Security Analysis',
    description: 'OWASP API Top 10:2023 coverage, authentication, and authorization checks',
    icon: '🛡️',
    recommended: true
  },
  {
    id: 'ckg',
    name: 'Code Knowledge Graph',
    description: 'AST-based code structure mapping and vulnerability visualization',
    icon: '🕸️',
    recommended: true
  },
  {
    id: 'targeting',
    name: 'Fuzz Target Analysis',
    description: 'AI-powered identification of high-risk functions for testing',
    icon: '🎯',
    recommended: true
  },
  {
    id: 'promptfuzz',
    name: 'PromptFuzz Generation',
    description: 'Generate intelligent fuzz inputs tailored to your code',
    icon: '💡',
    recommended: true
  },
  {
    id: 'fuzzing',
    name: 'Dynamic Fuzzing',
    description: 'VM-isolated execution with 500 iterations per function',
    icon: '🐛',
    recommended: true
  },
  {
    id: 'coverage-fuzzing',
    name: 'Coverage-Guided Fuzzing',
    description: 'Advanced AFL++-style fuzzing with code coverage feedback (slower)',
    icon: '📊',
    recommended: false
  },
  {
    id: 'symbolic-execution',
    name: 'Symbolic Execution',
    description: 'Path exploration and constraint solving for edge cases (slower)',
    icon: '🔬',
    recommended: false
  },
  {
    id: 'reporting',
    name: 'Vulnerability Reporting',
    description: 'Generate professional reports with CVSS scoring and remediation',
    icon: '📄',
    recommended: true
  }
];

const AnalysisOptionsModal: React.FC<AnalysisOptionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentSelections
}) => {
  const [selected, setSelected] = useState<string[]>(currentSelections);

  const toggleOption = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectRecommended = () => {
    setSelected(ANALYSIS_OPTIONS.filter(opt => opt.recommended).map(opt => opt.id));
  };

  const selectAll = () => {
    setSelected(ANALYSIS_OPTIONS.map(opt => opt.id));
  };

  const deselectAll = () => {
    setSelected([]);
  };

  const handleConfirm = () => {
    if (selected.length === 0) {
      alert('Please select at least one analysis option');
      return;
    }
    onConfirm(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
            <div>
              <h2 className="text-2xl font-bold text-white">Select Analysis Options</h2>
              <p className="text-sm text-gray-400 mt-1">
                Choose which security analyses you want to perform
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 p-4 bg-gray-800/30 border-b border-gray-700">
            <button
              onClick={selectRecommended}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              ⭐ Recommended
            </button>
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Deselect All
            </button>
            <div className="ml-auto text-sm text-gray-400 flex items-center">
              <span className="font-semibold text-blue-400">{selected.length}</span>
              <span className="ml-1">/ {ANALYSIS_OPTIONS.length} selected</span>
            </div>
          </div>

          {/* Options List */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid gap-3">
              {ANALYSIS_OPTIONS.map(option => (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => toggleOption(option.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selected.includes(option.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {selected.includes(option.id) ? (
                        <CheckSquare className="w-6 h-6 text-blue-400" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{option.icon}</span>
                        <h3 className="text-lg font-semibold text-white">
                          {option.name}
                        </h3>
                        {option.recommended && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700 bg-gray-800/50">
            <div className="text-sm text-gray-400">
              {selected.length === 0 ? (
                <span className="text-yellow-400">⚠️ Please select at least one option</span>
              ) : (
                <span>
                  Estimated time: ~{selected.length * 3}-{selected.length * 5} seconds
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selected.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Analysis
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AnalysisOptionsModal;
