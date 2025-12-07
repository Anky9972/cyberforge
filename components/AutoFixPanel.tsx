import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Check, X, Copy, Code, TestTube, AlertCircle, Download, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { AutoFixService } from '../services/autoFix';
import CodeBlock from './CodeBlock';

interface Vulnerability {
  id: string;
  type: string;
  severity: string;
  description: string;
  location: {
    file: string;
    line: number;
  };
  codeSnippet: string;
}

interface AutoFix {
  id: string;
  originalCode: string;
  patchedCode: string;
  explanation: string;
  confidence: number;
  tests: string;
  applied: boolean;
}

interface AutoFixPanelProps {
  vulnerability: Vulnerability;
  onClose?: () => void;
}

export const AutoFixPanel: React.FC<AutoFixPanelProps> = ({ vulnerability, onClose }) => {
  const [fix, setFix] = useState<AutoFix | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTests, setShowTests] = useState(false);

  const generateFix = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/autofix/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vulnerabilityId: vulnerability.id })
      });

      if (response.ok) {
        const data = await response.json();
        setFix(data.fix);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate fix');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Fix generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const applyFix = async () => {
    if (!fix) return;
    
    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/autofix/${fix.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setFix({ ...fix, applied: true });
      } else {
        setError('Failed to mark fix as applied');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Fix application error:', err);
    } finally {
      setApplying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wand2 className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-xl font-bold text-white">AI Auto-Fix</h3>
              <p className="text-sm text-gray-400">{vulnerability.type}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Vulnerability Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
            <div className="flex-1">
              <p className="text-white font-medium mb-2">{vulnerability.description}</p>
              <p className="text-sm text-gray-400">
                {vulnerability.location.file}:{vulnerability.location.line}
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        {!fix && !generating && (
          <button
            onClick={generateFix}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Wand2 className="w-5 h-5" />
            <span>Generate AI Fix</span>
          </button>
        )}

        {/* Generating State */}
        {generating && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Analyzing vulnerability and generating fix...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Fix Display */}
        <AnimatePresence>
          {fix && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Confidence Badge */}
              <div className="flex items-center justify-between">
                <div className={`text-sm font-semibold ${getConfidenceColor(fix.confidence)}`}>
                  {getConfidenceLabel(fix.confidence)} ({Math.round(fix.confidence * 100)}%)
                </div>
                {fix.applied && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Applied</span>
                  </div>
                )}
              </div>

              {/* Explanation */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Explanation</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{fix.explanation}</p>
              </div>

              {/* Code Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Code */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold text-sm flex items-center space-x-2">
                      <Code className="w-4 h-4" />
                      <span>Original Code</span>
                    </h4>
                    <button
                      onClick={() => copyToClipboard(fix.originalCode)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                    <code>{fix.originalCode}</code>
                  </pre>
                </div>

                {/* Patched Code */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold text-sm flex items-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span>Fixed Code</span>
                    </h4>
                    <button
                      onClick={() => copyToClipboard(fix.patchedCode)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <pre className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                    <code>{fix.patchedCode}</code>
                  </pre>
                </div>
              </div>

              {/* Tests */}
              {fix.tests && (
                <div>
                  <button
                    onClick={() => setShowTests(!showTests)}
                    className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-2"
                  >
                    <TestTube className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {showTests ? 'Hide' : 'Show'} Unit Tests
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {showTests && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <pre className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                          <code>{fix.tests}</code>
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Action Buttons */}
              {!fix.applied && (
                <div className="flex space-x-4">
                  <button
                    onClick={applyFix}
                    disabled={applying}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    {applying ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Mark as Applied</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setFix(null)}
                    className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
