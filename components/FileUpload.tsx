
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileArchive, AlertCircle, Sparkles, ShieldCheck, Lock, Scan, Clock } from 'lucide-react';
import { UploadOptimizer } from '../services/uploadOptimizer';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB - increased for large codebases

  const validateFile = (file: File): string | null => {
    // Check file extension
    if (!file.name.endsWith('.zip')) {
      return "❌ Please upload a ZIP file";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `❌ File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Check for empty file
    if (file.size === 0) {
      return "❌ File is empty";
    }

    // Show estimated processing time for large files
    if (file.size > 1024 * 1024) { // > 1MB
      const estimate = UploadOptimizer.estimateProcessingTime(file.size);
      const minutes = Math.floor(estimate.estimatedSeconds / 60);
      const seconds = estimate.estimatedSeconds % 60;
      const timeStr = minutes > 0 
        ? `${minutes}m ${seconds}s` 
        : `${seconds}s`;
      setEstimatedTime(`⏱️ Estimated time: ~${timeStr}`);
    } else {
      setEstimatedTime(null);
    }

    return null;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      onFileUpload(file);
    }
  };

  const loadSampleProject = (sampleName: string) => {
    if (disabled) return;
    const mockFile = new File(['mock'], sampleName, { type: 'application/zip' });
    onFileUpload(mockFile);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className="relative overflow-hidden"
    >
      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-green-400" />
        <span className="text-sm text-gray-400">
          <span className="text-green-400 font-semibold">Secure Upload</span> - Your code is analyzed locally and never stored
        </span>
      </div>

      <motion.div
        animate={dragActive ? { scale: 1.02, borderColor: "rgba(59, 130, 246, 0.5)" } : { scale: 1 }}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 backdrop-blur-sm ${
          dragActive 
            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' 
            : 'border-gray-600 bg-gray-800/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-gray-800/80 hover:shadow-lg hover:shadow-blue-500/10'}`}
      >
        {/* Animated Corner Borders */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-blue-500 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {/* Scanning Grid Animation */}
        {disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5"
            animate={{
              backgroundPosition: ['0% 0%', '0% 100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(59, 130, 246, 0.1) 0px, transparent 2px, transparent 4px, rgba(59, 130, 246, 0.1) 6px)',
              backgroundSize: '100% 20px'
            }}
          />
        )}

        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".zip"
          onChange={handleChange}
          disabled={disabled}
        />
        
        <label 
          htmlFor="file-upload" 
          className={`relative z-10 flex flex-col items-center justify-center space-y-6 group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {/* Icon with animation */}
          <motion.div
            animate={dragActive ? { scale: 1.2, rotate: 10 } : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 p-8 rounded-2xl shadow-2xl group-hover:shadow-blue-500/50 transition-shadow">
              {disabled ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Scan className="w-16 h-16 text-white" />
                </motion.div>
              ) : dragActive ? (
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <FileArchive className="w-16 h-16 text-white" />
                </motion.div>
              ) : (
                <Upload className="w-16 h-16 text-white" />
              )}
            </div>
            
            {/* Pulse rings */}
            {!disabled && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-2 border-blue-400 rounded-2xl"
                />
                <motion.div
                  animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 border-2 border-purple-400 rounded-2xl"
                />
              </>
            )}
          </motion.div>

          <div className="space-y-3">
            {estimatedTime && !disabled && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-700/50 rounded-lg"
              >
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300">{estimatedTime}</span>
              </motion.div>
            )}
            <p className="text-2xl font-bold">
              {disabled ? (
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                  Analyzing Your Code...
                </span>
              ) : dragActive ? (
                <span className="bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text">
                  Drop to Start Scan
                </span>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                    Upload Codebase
                  </span>
                  <span className="text-gray-400 block text-lg mt-2">or drag and drop</span>
                </>
              )}
            </p>
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <Lock className="w-4 h-4 text-green-400" />
              <span className="text-sm">Secure • Private • Encrypted</span>
            </div>
            <p className="text-gray-500 flex items-center justify-center gap-2">
              <FileArchive className="w-4 h-4" />
              ZIP files only • Max 50MB
            </p>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="bg-red-900/50 border-2 border-red-600 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-lg"
              >
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {disabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 pt-4"
            >
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                />
                <span className="text-lg font-medium bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                  Initializing Security Scan...
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4" />
                <span>AI agents are analyzing your codebase</span>
              </div>
            </motion.div>
          )}
        </label>
      </motion.div>
      
      {/* Sample Projects Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10"
      >
        <div className="text-center mb-6">
          <p className="text-gray-400 text-base font-medium mb-2">
            Or try a vulnerable sample project
          </p>
          <p className="text-gray-600 text-sm">
            Pre-configured codebases with known security issues for testing
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.button 
            onClick={() => loadSampleProject('vulnerable-web-server.zip')}
            disabled={disabled}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30 hover:border-blue-400/50 text-white px-6 py-5 rounded-xl font-medium transition-all duration-200 flex flex-col items-center gap-3 shadow-lg hover:shadow-blue-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center gap-3 w-full">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <span className="text-2xl">🌐</span>
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Web Server</div>
                <div className="text-xs text-gray-400">Node.js + Express</div>
              </div>
            </div>
            <div className="relative w-full text-left text-xs text-gray-400">
              Contains: SQL Injection, XSS, CSRF
            </div>
          </motion.button>
          
          <motion.button 
            onClick={() => loadSampleProject('buffer-overflow-demo.zip')}
            disabled={disabled}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-red-600/20 to-pink-600/20 hover:from-red-600/30 hover:to-pink-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30 hover:border-red-400/50 text-white px-6 py-5 rounded-xl font-medium transition-all duration-200 flex flex-col items-center gap-3 shadow-lg hover:shadow-red-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center gap-3 w-full">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <span className="text-2xl">💥</span>
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">Buffer Overflow</div>
                <div className="text-xs text-gray-400">C/C++ Code</div>
              </div>
            </div>
            <div className="relative w-full text-left text-xs text-gray-400">
              Contains: Memory corruption, Stack smashing
            </div>
          </motion.button>
          
          <motion.button 
            onClick={() => loadSampleProject('sql-injection-example.zip')}
            disabled={disabled}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-purple-600/20 to-violet-600/20 hover:from-purple-600/30 hover:to-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 hover:border-purple-400/50 text-white px-6 py-5 rounded-xl font-medium transition-all duration-200 flex flex-col items-center gap-3 shadow-lg hover:shadow-purple-500/30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center gap-3 w-full">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <span className="text-2xl">💉</span>
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold">SQL Injection</div>
                <div className="text-xs text-gray-400">Python + Django</div>
              </div>
            </div>
            <div className="relative w-full text-left text-xs text-gray-400">
              Contains: Blind SQL, Union attacks
            </div>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FileUpload;
