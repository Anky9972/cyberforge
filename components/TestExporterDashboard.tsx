/**
 * Test Exporter Dashboard
 * Features: One-click test generation, framework selector, code preview, download tests
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode, Download, Copy, CheckCircle, Play, Settings,
  Code, Terminal, Package, Zap, ChevronDown, ChevronRight
} from 'lucide-react';
import CodeBlock from './CodeBlock';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  input: string | Buffer;
  expectedBehavior: string;
  actualBehavior: string;
  severity: string;
  crashInfo?: {
    signal: string;
    stackTrace: string;
    errorMessage: string;
  };
}

export interface GeneratedTest {
  framework: 'jest' | 'pytest' | 'junit' | 'mocha' | 'go';
  filename: string;
  content: string;
  language: string;
}

interface TestExporterDashboardProps {
  testCases: TestCase[];
  onGenerateTest?: (testCaseId: string, framework: string, options: any) => Promise<GeneratedTest>;
  onDownloadTest?: (test: GeneratedTest) => void;
  onRunTest?: (test: GeneratedTest) => void;
}

const FRAMEWORKS = [
  { id: 'jest', name: 'Jest', language: 'JavaScript/TypeScript', icon: '⚡', color: 'red' },
  { id: 'pytest', name: 'Pytest', language: 'Python', icon: '🐍', color: 'blue' },
  { id: 'junit', name: 'JUnit', language: 'Java', icon: '☕', color: 'orange' },
  { id: 'mocha', name: 'Mocha', language: 'JavaScript', icon: '☕', color: 'brown' },
  { id: 'go', name: 'Go Test', language: 'Go', icon: '🔷', color: 'cyan' },
];

export const TestExporterDashboard: React.FC<TestExporterDashboardProps> = ({
  testCases,
  onGenerateTest,
  onDownloadTest,
  onRunTest
}) => {
  const [selectedFramework, setSelectedFramework] = useState<string>('jest');
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);
  const [generatedTests, setGeneratedTests] = useState<Map<string, GeneratedTest>>(new Map());
  const [generating, setGenerating] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState<string | null>(null);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Test generation options
  const [options, setOptions] = useState({
    targetFunction: 'targetFunction',
    importPath: './target',
    setupCode: '',
    teardownCode: '',
    timeout: 5000,
    retries: 0,
  });

  const handleGenerateTest = async (testCaseId: string) => {
    if (!onGenerateTest) return;
    
    setGenerating(testCaseId);
    try {
      const test = await onGenerateTest(testCaseId, selectedFramework, options);
      setGeneratedTests(new Map(generatedTests.set(testCaseId, test)));
      setExpandedTest(testCaseId);
    } catch (error) {
      console.error('Failed to generate test:', error);
    } finally {
      setGenerating(null);
    }
  };

  const handleCopyTest = async (testCaseId: string) => {
    const test = generatedTests.get(testCaseId);
    if (!test) return;

    try {
      await navigator.clipboard.writeText(test.content);
      setCopied(testCaseId);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadTest = (testCaseId: string) => {
    const test = generatedTests.get(testCaseId);
    if (!test || !onDownloadTest) return;
    onDownloadTest(test);
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'blue',
    };
    return colors[severity.toLowerCase()] || 'gray';
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
              <FileCode className="w-8 h-8 text-green-400" />
              Test Exporter
            </h1>
            <p className="text-gray-400 mt-2">
              Generate regression tests from {testCases.length} crash{testCases.length !== 1 ? 'es' : ''}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{testCases.length}</div>
              <div className="text-xs text-gray-400">Test Cases</div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{generatedTests.size}</div>
              <div className="text-xs text-gray-400">Generated</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{FRAMEWORKS.length}</div>
              <div className="text-xs text-gray-400">Frameworks</div>
            </div>
          </div>
        </motion.div>

        {/* Framework Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Select Test Framework
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {FRAMEWORKS.map((framework) => (
              <motion.button
                key={framework.id}
                onClick={() => setSelectedFramework(framework.id)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedFramework === framework.id
                    ? `border-${framework.color}-500 bg-${framework.color}-900/30`
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                }`}
              >
                <div className="text-3xl mb-2">{framework.icon}</div>
                <div className="font-bold text-white text-sm">{framework.name}</div>
                <div className="text-xs text-gray-400 mt-1">{framework.language}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Configuration Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            Test Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target Function
              </label>
              <input
                type="text"
                value={options.targetFunction}
                onChange={(e) => setOptions({ ...options, targetFunction: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="functionName"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Import Path
              </label>
              <input
                type="text"
                value={options.importPath}
                onChange={(e) => setOptions({ ...options, importPath: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="./target"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Setup Code (optional)
              </label>
              <textarea
                value={options.setupCode}
                onChange={(e) => setOptions({ ...options, setupCode: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={2}
                placeholder="// Setup code..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teardown Code (optional)
              </label>
              <textarea
                value={options.teardownCode}
                onChange={(e) => setOptions({ ...options, teardownCode: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={2}
                placeholder="// Teardown code..."
              />
            </div>
          </div>
        </motion.div>

        {/* Test Cases List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-green-400" />
            Test Cases ({testCases.length})
          </h3>

          {testCases.map((testCase, index) => {
            const isGenerated = generatedTests.has(testCase.id);
            const isGenerating = generating === testCase.id;
            const isExpanded = expandedTest === testCase.id;
            const isCopied = copied === testCase.id;
            const generatedTest = generatedTests.get(testCase.id);

            return (
              <motion.div
                key={testCase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all"
              >
                {/* Test Case Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-white">{testCase.name}</h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold`}
                          style={{
                            backgroundColor: `var(--color-${getSeverityColor(testCase.severity)}-900)`,
                            color: `var(--color-${getSeverityColor(testCase.severity)}-400)`,
                          }}
                        >
                          {testCase.severity.toUpperCase()}
                        </span>
                        {isGenerated && (
                          <span className="px-3 py-1 bg-green-900/30 border border-green-500/30 rounded-full text-xs font-bold text-green-400">
                            ✓ Generated
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{testCase.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Expected:</span>
                          <span className="text-gray-300 ml-2">{testCase.expectedBehavior}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Actual:</span>
                          <span className="text-red-400 ml-2">{testCase.actualBehavior}</span>
                        </div>
                      </div>
                      {testCase.crashInfo && (
                        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-red-400 mt-0.5" />
                            <div className="text-sm">
                              <div className="text-red-300 font-medium">{testCase.crashInfo.signal}</div>
                              <div className="text-red-400/80 text-xs">{testCase.crashInfo.errorMessage}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {!isGenerated ? (
                        <button
                          onClick={() => handleGenerateTest(testCase.id)}
                          disabled={isGenerating}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              >
                                <Zap className="w-4 h-4" />
                              </motion.div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Code className="w-4 h-4" />
                              <span>Generate Test</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setExpandedTest(isExpanded ? null : testCase.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span>View Code</span>
                          </button>
                          <button
                            onClick={() => handleCopyTest(testCase.id)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all flex items-center gap-2"
                          >
                            {isCopied ? (
                              <><CheckCircle className="w-4 h-4 text-green-400" /><span>Copied!</span></>
                            ) : (
                              <><Copy className="w-4 h-4" /><span>Copy</span></>
                            )}
                          </button>
                          <button
                            onClick={() => handleDownloadTest(testCase.id)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                          {onRunTest && (
                            <button
                              onClick={() => generatedTest && onRunTest(generatedTest)}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              <span>Run Test</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generated Test Code */}
                <AnimatePresence>
                  {isExpanded && generatedTest && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-700 overflow-hidden"
                    >
                      <div className="p-6 bg-gray-900/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Terminal className="w-5 h-5 text-green-400" />
                            <h4 className="font-bold text-white">{generatedTest.filename}</h4>
                            <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-mono">
                              {generatedTest.language}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-lg overflow-hidden">
                          <CodeBlock 
                            code={generatedTest.content} 
                            language={generatedTest.language.toLowerCase()} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {testCases.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No test cases available</p>
            <p className="text-sm mt-2">Run fuzzing to generate crash test cases</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestExporterDashboard;
