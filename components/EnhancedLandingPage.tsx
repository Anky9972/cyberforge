import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, Target, Lock, Code, Bug, ChevronRight, 
  Database, Terminal, Eye, Layers, Activity, Cpu, 
  Network, Search, FileSearch, AlertTriangle, CheckCircle2, 
  TrendingUp, Play, Scan, ShieldCheck, ShieldAlert, Radio
} from 'lucide-react';
import { HiShieldCheck, HiShieldExclamation } from 'react-icons/hi';
import { NavHeader } from './NavHeader';

interface EnhancedLandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about') => void;
}

const EnhancedLandingPage: React.FC<EnhancedLandingPageProps> = ({ onGetStarted, onLogin, onNavigate }) => {
  const [scanningDemo, setScanningDemo] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);
  const [codeLines, setCodeLines] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (codeLines < 10000) {
      const timer = setTimeout(() => {
        setCodeLines(codeLines + 234);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [codeLines]);

  const securityFeatures = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "AST-Based Analysis",
      description: "Real code structure parsing using Babel & Tree-sitter. No hallucinations, actual security flaws.",
      color: "from-blue-500 to-cyan-500",
      badge: "Real-time",
      stats: "50ms avg"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Parallel Execution",
      description: "Multi-agent concurrent analysis. Reconnaissance + API security run simultaneously.",
      color: "from-yellow-500 to-orange-500",
      badge: "40% Faster",
      stats: "3.2s scan"
    },
    {
      icon: <Bug className="w-8 h-8" />,
      title: "Dynamic Fuzzing",
      description: "VM-isolated execution with 500 iterations. Real crash detection, not static analysis.",
      color: "from-red-500 to-pink-500",
      badge: "Advanced",
      stats: "500 iter/func"
    },
    {
      icon: <ShieldAlert className="w-8 h-8" />,
      title: "OWASP Coverage",
      description: "Complete OWASP API Security Top 10:2023. Authentication, authorization, rate limiting.",
      color: "from-green-500 to-emerald-500",
      badge: "OWASP",
      stats: "10/10 checks"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Code Knowledge Graph",
      description: "Interactive attack surface mapping. Visualize data flows and vulnerability chains.",
      color: "from-purple-500 to-violet-500",
      badge: "Visual",
      stats: "D3.js powered"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "CVE Intelligence",
      description: "Automatic NVD database matching. Get CVE IDs and CVSS scores for known vulnerabilities.",
      color: "from-indigo-500 to-blue-500",
      badge: "NVD",
      stats: "180k CVEs"
    }
  ];

  const vulnerabilityTypes = [
    { name: "SQL Injection", detected: 127, severity: "critical", trend: "+12%" },
    { name: "XSS", detected: 93, severity: "high", trend: "+8%" },
    { name: "CSRF", detected: 45, severity: "medium", trend: "-3%" },
    { name: "Auth Issues", detected: 67, severity: "high", trend: "+15%" },
    { name: "Buffer Overflow", detected: 34, severity: "critical", trend: "+5%" },
  ];

  const stats = [
    { 
      value: "99.9%", 
      label: "Detection Accuracy",
      description: "False positive rate < 0.1%",
      icon: <HiShieldCheck className="w-8 h-8" />,
      color: "from-green-400 to-emerald-500"
    },
    { 
      value: "40%", 
      label: "Faster Analysis",
      description: "Compared to sequential scanning",
      icon: <TrendingUp className="w-8 h-8" />,
      color: "from-blue-400 to-cyan-500"
    },
    { 
      value: "180K+", 
      label: "CVE Database",
      description: "Up-to-date threat intelligence",
      icon: <AlertTriangle className="w-8 h-8" />,
      color: "from-orange-400 to-red-500"
    },
    { 
      value: "24/7", 
      label: "Real-time Monitoring",
      description: "Continuous security analysis",
      icon: <Activity className="w-8 h-8" />,
      color: "from-purple-400 to-pink-500"
    }
  ];

  const scanSteps = [
    { step: 1, name: "Reconnaissance", status: "complete", time: "0.8s" },
    { step: 2, name: "AST Analysis", status: "complete", time: "1.2s" },
    { step: 3, name: "Fuzzing", status: "scanning", time: "2.1s" },
    { step: 4, name: "CVE Matching", status: "pending", time: "--" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Navigation Header */}
      <NavHeader 
        onGetStarted={onGetStarted} 
        onLogin={onLogin}
        onNavigate={onNavigate}
        transparent={true}
      />
      
      {/* Animated Matrix Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="matrix-bg"></div>
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl top-1/4 left-1/4"
        ></motion.div>
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl bottom-1/4 right-1/4"
        ></motion.div>
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl top-1/2 left-1/2"
        ></motion.div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          className="container mx-auto px-4 pt-8 lg:pt-12 pb-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Text */}
              <div>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6"
                >
                  <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-sm font-medium text-blue-300">AI-Powered Security Platform</span>
                </motion.div>

                {/* Main Title */}
                <motion.h1 
                  className="text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  <span className="block mb-2">Secure Your</span>
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">
                    Codebase
                  </span>
                </motion.h1>

                <motion.p 
                  className="text-xl md:text-2xl text-gray-400 mb-8 leading-relaxed"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  Enterprise-grade vulnerability detection powered by AI agents. 
                  <span className="text-blue-400 font-semibold"> Find security flaws before attackers do.</span>
                </motion.p>

                {/* CTA Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  <motion.button
                    onClick={onGetStarted}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-2xl overflow-hidden"
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(59, 130, 246, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relative z-10 flex items-center gap-2 justify-center">
                      <ShieldCheck className="w-6 h-6" />
                      Start Free Scan
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>

                  <motion.button
                    onClick={() => setScanningDemo(!scanningDemo)}
                    className="group px-8 py-4 border-2 border-gray-600 rounded-xl font-bold text-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </motion.button>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-12 flex items-center gap-6 text-sm text-gray-500"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>OWASP Compliant</span>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Interactive Security Dashboard */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative"
              >
                {/* Main Dashboard Card */}
                <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Scan className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Security Scan</h3>
                        <p className="text-sm text-gray-400">Real-time Analysis</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: scanningDemo ? 360 : 0 }}
                      transition={{ duration: 2, repeat: scanningDemo ? Infinity : 0, ease: "linear" }}
                      className="p-2 bg-green-500/20 rounded-full"
                    >
                      <Activity className="w-5 h-5 text-green-400" />
                    </motion.div>
                  </div>

                  {/* Scanning Progress */}
                  <div className="space-y-3 mb-6">
                    {scanSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                            step.status === 'scanning' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-600/20 text-gray-500'
                          }`}>
                            {step.status === 'complete' ? <CheckCircle2 className="w-5 h-5" /> :
                             step.status === 'scanning' ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Scan className="w-5 h-5" /></motion.div> :
                             <div className="w-2 h-2 bg-gray-500 rounded-full"></div>}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{step.name}</p>
                            <p className="text-xs text-gray-500">{step.time}</p>
                          </div>
                        </div>
                        {step.status === 'scanning' && (
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-xs font-medium text-blue-400"
                          >
                            Analyzing...
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Vulnerability Count */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-gray-400">Critical</span>
                      </div>
                      <p className="text-3xl font-bold text-red-400">23</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-gray-400">High</span>
                      </div>
                      <p className="text-3xl font-bold text-yellow-400">45</p>
                    </div>
                  </div>

                  {/* Lines Scanned Counter */}
                  <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Lines Scanned</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                          {codeLines.toLocaleString()}+
                        </p>
                      </div>
                      <FileSearch className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-6 -right-6 p-4 bg-gradient-to-br from-green-500/90 to-emerald-500/90 backdrop-blur-xl rounded-xl shadow-2xl"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-medium">Secure</p>
                      <p className="text-2xl font-bold">98.7%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -bottom-6 -left-6 p-4 bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-xl rounded-xl shadow-2xl"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-medium">Speed</p>
                      <p className="text-2xl font-bold">3.2s</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10"
                    style={{ background: `linear-gradient(to bottom right, ${stat.color})` }}
                  ></div>
                  <div className={`p-6 bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl`}>
                    <div className={`inline-block p-3 bg-gradient-to-br ${stat.color} rounded-xl mb-4 text-white`}>
                      {stat.icon}
                    </div>
                    <div className="text-4xl font-bold mb-2 bg-gradient-to-br bg-clip-text text-transparent"
                      style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`, 
                        backgroundClip: 'text', WebkitBackgroundClip: 'text' }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{stat.label}</div>
                    <div className="text-xs text-gray-400">{stat.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">Enterprise Security</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-400 text-transparent bg-clip-text">
                Military-Grade Protection
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Advanced AI agents work in parallel to detect vulnerabilities that traditional tools miss
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-500`}></div>
                
                <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 h-full">
                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 bg-gradient-to-r ${feature.color} text-white text-xs font-bold rounded-full`}>
                      {feature.badge}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`inline-block p-4 bg-gradient-to-br ${feature.color} rounded-xl mb-4 text-white shadow-lg`}>
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-gray-500">{feature.stats}</span>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Vulnerability Detection Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Vulnerability List */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h2 className="text-4xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-red-400 to-orange-400 text-transparent bg-clip-text">
                    Detect All Threat Vectors
                  </span>
                </h2>
                <p className="text-xl text-gray-400 mb-8">
                  Comprehensive coverage of OWASP Top 10 and beyond
                </p>

                {vulnerabilityTypes.map((vuln, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 10 }}
                    className="p-4 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl flex items-center justify-between group hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        vuln.severity === 'critical' ? 'bg-red-500/20' :
                        vuln.severity === 'high' ? 'bg-orange-500/20' :
                        'bg-yellow-500/20'
                      }`}>
                        <AlertTriangle className={`w-6 h-6 ${
                          vuln.severity === 'critical' ? 'text-red-400' :
                          vuln.severity === 'high' ? 'text-orange-400' :
                          'text-yellow-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{vuln.name}</h4>
                        <p className="text-sm text-gray-400">{vuln.detected} instances detected</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${
                          vuln.trend.startsWith('+') ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {vuln.trend}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Right - Circular Progress */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  {/* Center Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <HiShieldExclamation className="w-24 h-24 text-red-400 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-6xl font-bold bg-gradient-to-r from-red-400 to-orange-400 text-transparent bg-clip-text mb-2">
                        366
                      </p>
                      <p className="text-gray-400">Total Issues Found</p>
                    </div>
                  </div>

                  {/* Circular Progress Rings */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="20"
                    />
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="20"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 0.75 }}
                      viewport={{ once: true }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      strokeDasharray="1000"
                      strokeDashoffset="1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="50%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#eab308" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl"
          >
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTI0IDM2YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-10"></div>

            <div className="relative z-10 px-12 py-16 md:py-20 text-center">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-2xl mb-6"
              >
                <Shield className="w-16 h-16" />
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Secure Your Code?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of developers who trust FuzzForge to protect their applications from security threats.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  onClick={onGetStarted}
                  className="px-10 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-2xl hover:shadow-white/50 transition-shadow flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShieldCheck className="w-6 h-6" />
                  Start Free Security Scan
                </motion.button>

                <motion.button
                  onClick={() => onNavigate?.('docs')}
                  className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Eye className="w-6 h-6" />
                  View Documentation
                </motion.button>
              </div>

              <p className="mt-8 text-sm text-blue-200">
                ✓ No credit card required  •  ✓ Free tier available  •  ✓ Enterprise support
              </p>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-12 border-t border-gray-800">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                FuzzForge
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2025 FuzzForge. Securing the future of software development.
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes matrix {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .matrix-bg {
          background-image: repeating-linear-gradient(
            0deg,
            rgba(59, 130, 246, 0.03) 0px,
            transparent 1px,
            transparent 2px,
            rgba(59, 130, 246, 0.03) 3px
          );
          animation: matrix 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default EnhancedLandingPage;
