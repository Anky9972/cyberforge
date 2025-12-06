import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, AlertTriangle, CheckCircle, Terminal, RefreshCw, ChevronRight } from 'lucide-react';

const VULNERABLE_CODE = `function login(username, password) {
  // TODO: Fix SQL Injection vulnerability
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  return db.execute(query);
}`;

const SECURE_CODE = `function login(username, password) {
  // Fixed using parameterized query
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  return db.execute(query, [username, password]);
}`;

export const LivePlayground: React.FC = () => {
    const [code, setCode] = useState(VULNERABLE_CODE);
    const [isScanning, setIsScanning] = useState(false);
    const [result, setResult] = useState<'vulnerable' | 'secure' | null>(null);

    const handleScan = () => {
        setIsScanning(true);
        setResult(null);

        // Simulate scan delay
        setTimeout(() => {
            setIsScanning(false);
            if (code.includes("SELECT * FROM users WHERE username = '\" + username + \"'")) {
                setResult('vulnerable');
            } else {
                setResult('secure');
            }
        }, 1500);
    };

    const fixCode = () => {
        setCode(SECURE_CODE);
        setResult(null);
    };

    const resetCode = () => {
        setCode(VULNERABLE_CODE);
        setResult(null);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-1 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="bg-[#0f1117] rounded-xl overflow-hidden shadow-inner">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#1e2029] border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="ml-3 text-sm text-gray-400 font-mono flex items-center gap-2">
                            <Terminal size={14} className="text-blue-400" />
                            vulnerability_demo.js
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={resetCode}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                        >
                            <RefreshCw size={12} /> Reset
                        </button>
                        <button
                            onClick={handleScan}
                            disabled={isScanning}
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${isScanning
                                    ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25'
                                }`}
                        >
                            {isScanning ? (
                                <>
                                    <RefreshCw className="animate-spin" size={14} />
                                    Scanning...
                                </>
                            ) : (
                                <>
                                    <Play size={14} />
                                    Run Security Scan
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Editor & Results Split */}
                <div className="grid md:grid-cols-2 h-[400px]">
                    {/* Code Editor Area */}
                    <div className="relative group">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e2029]/50 border-r border-gray-800 flex flex-col items-center py-4 text-gray-600 font-mono text-sm select-none">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => <div key={i} className="h-6">{i}</div>)}
                        </div>
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-full pl-16 pr-4 py-4 bg-[#0f1117] text-gray-300 font-mono text-sm resize-none focus:outline-none focus:ring-0 selection:bg-blue-500/30"
                            spellCheck={false}
                        />
                    </div>

                    {/* Results Area */}
                    <div className="bg-[#13151c] border-l border-gray-800 p-6 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {!result && !isScanning && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center text-center text-gray-500"
                                >
                                    <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
                                        <Play size={32} className="ml-1 opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-300 mb-2">Ready to Scan</h3>
                                    <p className="text-sm max-w-[200px]">
                                        Click "Run Security Scan" to analyze the code for vulnerabilities.
                                    </p>
                                </motion.div>
                            )}

                            {isScanning && (
                                <motion.div
                                    key="scanning"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center"
                                >
                                    <div className="relative w-20 h-20 mb-6">
                                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Terminal className="text-blue-400" size={24} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <div className="text-blue-400 font-medium animate-pulse">Analyzing AST...</div>
                                        <div className="text-gray-500 text-sm">Checking for injection patterns</div>
                                    </div>
                                </motion.div>
                            )}

                            {result === 'vulnerable' && (
                                <motion.div
                                    key="vuln"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col"
                                >
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-red-500/10 rounded-lg">
                                            <AlertTriangle className="text-red-500" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-red-400 font-bold text-lg">Critical Vulnerability Found</h3>
                                            <p className="text-red-400/60 text-sm">CWE-89: SQL Injection</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-red-950/10 border border-red-500/20 rounded-lg p-4 mb-6 overflow-y-auto">
                                        <p className="text-gray-300 text-sm mb-3">
                                            Unsanitized user input <code className="text-red-300 bg-red-900/30 px-1 rounded">username</code> is directly concatenated into the SQL query string.
                                        </p>
                                        <div className="bg-black/30 rounded p-3 font-mono text-xs text-red-300 border-l-2 border-red-500">
                                            "SELECT * FROM users WHERE..." + username
                                        </div>
                                    </div>

                                    <button
                                        onClick={fixCode}
                                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                    >
                                        <CheckCircle size={18} />
                                        Auto-Fix with AI
                                    </button>
                                </motion.div>
                            )}

                            {result === 'secure' && (
                                <motion.div
                                    key="secure"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center"
                                >
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]">
                                        <CheckCircle className="text-green-500" size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Code is Secure</h3>
                                    <p className="text-gray-400 mb-8 max-w-[280px]">
                                        No vulnerabilities detected! The code properly uses parameterized queries to prevent SQL injection.
                                    </p>
                                    <button
                                        onClick={resetCode}
                                        className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 group"
                                    >
                                        Try another example <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[18px] blur opacity-20 -z-10 group-hover:opacity-100 transition duration-1000"></div>
        </div>
    );
};
