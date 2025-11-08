import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Shield, Zap, Target, Lock, Code, Bug, ChevronRight, Sparkles, Database, Terminal, Eye, Layers, Activity, Cpu, Network, Search, FileSearch, AlertTriangle, CheckCircle2, TrendingUp, Github, Play } from 'lucide-react';
import { HiShieldCheck, HiShieldExclamation } from 'react-icons/hi';
import { SiHackerone, SiVirustotal } from 'react-icons/si';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [scanningDemo, setScanningDemo] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      opacity: [0.3, 1, 0.3],
      transition: { duration: 3, repeat: Infinity }
    });
  }, [controls]);

  const securityFeatures = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "AST-Based Analysis",
      description: "Real code structure parsing using Babel & Tree-sitter, not LLM hallucinations",
      color: "from-blue-500 to-cyan-500",
      badge: "Real-time"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Parallel Execution",
      description: "40% faster with concurrent multi-agent analysis",
      color: "from-yellow-500 to-orange-500",
      badge: "Fast"
    },
    {
      icon: <Bug className="w-8 h-8" />,
      title: "Dynamic Fuzzing",
      description: "VM-isolated execution with 500 iterations per function",
      color: "from-red-500 to-pink-500",
      badge: "Advanced"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "API Security",
      description: "Full OWASP API Security Top 10:2023 coverage",
      color: "from-green-500 to-emerald-500",
      badge: "OWASP"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Code Knowledge Graph",
      description: "Visual attack surface mapping with interactive D3.js graphs",
      color: "from-purple-500 to-violet-500",
      badge: "Visual"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "CVE Integration",
      description: "Automatic threat intelligence matching with NVD database",
      color: "from-indigo-500 to-blue-500",
      badge: "Intel"
    }
  ];

  const vulnerabilityTypes = [
    { name: "SQL Injection", detected: 127, color: "bg-red-500" },
    { name: "XSS", detected: 93, color: "bg-orange-500" },
    { name: "CSRF", detected: 45, color: "bg-yellow-500" },
    { name: "Auth Issues", detected: 67, color: "bg-purple-500" },
    { name: "Buffer Overflow", detected: 34, color: "bg-pink-500" },
  ];

  const stats = [
    { 
      value: "99.9%", 
      label: "Detection Rate",
      icon: <HiShieldCheck className="w-6 h-6" />,
      color: "text-green-400"
    },
    { 
      value: "40%", 
      label: "Faster Analysis",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "text-blue-400"
    },
    { 
      value: "500+", 
      label: "CVEs Detected",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "text-orange-400"
    },
    { 
      value: "24/7", 
      label: "Monitoring",
      icon: <Activity className="w-6 h-6" />,
      color: "text-purple-400"
    }
  ];

  const threatLevels = [
    { level: "Critical", count: 23, percentage: 85 },
    { level: "High", count: 45, percentage: 65 },
    { level: "Medium", count: 67, percentage: 45 },
    { level: "Low", count: 12, percentage: 25 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          className="container mx-auto px-4 pt-20 pb-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center max-w-5xl mx-auto">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="inline-block mb-8"
            >
              <div className="relative">
                <Shield className="w-24 h-24 text-blue-500 mx-auto" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(59, 130, 246, 0.5)",
                      "0 0 60px rgba(59, 130, 246, 0.8)",
                      "0 0 20px rgba(59, 130, 246, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1 
              className="text-6xl md:text-8xl font-extrabold mb-6"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text animate-gradient">
                FuzzForge
              </span>
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-gray-300 mb-4"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              AI-Powered Security Analysis & Vulnerability Detection
            </motion.p>

            <motion.p 
              className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              Forging resilience through intelligent fuzzing. Combine static code analysis, 
              dynamic fuzzing, and AI-powered vulnerability detection to identify critical security flaws.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <motion.button
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full font-bold text-lg shadow-2xl overflow-hidden"
                whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(59, 130, 246, 0.4)" }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              <motion.a
                href="#features"
                className="px-8 py-4 border-2 border-gray-600 rounded-full font-bold text-lg hover:border-blue-500 hover:bg-blue-500/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <Sparkles className="w-10 h-10 text-yellow-400" />
              Powerful Features
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Enterprise-grade security analysis powered by cutting-edge AI technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-gray-600 transition-all duration-300"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-block p-3 bg-gradient-to-br ${feature.color} rounded-xl mb-4 text-white`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <Target className="w-10 h-10 text-cyan-400" />
              How It Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Simple, powerful, and automated security analysis in three steps
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Upload Your Codebase",
                description: "Simply upload your project as a ZIP file. We support JavaScript, Python, Java, and more.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "02",
                title: "AI Agents Analyze",
                description: "Our specialized AI agents perform reconnaissance, API security checks, and dynamic fuzzing in parallel.",
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Get Detailed Report",
                description: "Receive comprehensive vulnerability reports with CVE mapping, severity scores, and remediation steps.",
                color: "from-green-500 to-emerald-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative mb-12 last:mb-0"
              >
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Step Number */}
                  <motion.div
                    className={`flex-shrink-0 w-24 h-24 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-3xl font-bold shadow-2xl`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {item.step}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 md:p-8">
                    <h3 className="text-2xl font-bold mb-3 text-white">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Connector line */}
                {index < 2 && (
                  <div className="hidden md:block absolute left-12 top-24 w-0.5 h-12 bg-gradient-to-b from-gray-600 to-transparent"></div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Secure Your Code?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Start analyzing your codebase now and discover vulnerabilities before attackers do.
              </p>
              <motion.button
                onClick={onGetStarted}
                className="px-12 py-4 bg-white text-blue-600 rounded-full font-bold text-lg shadow-2xl hover:shadow-white/50 transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Free Analysis
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center border-t border-gray-800">
          <p className="text-gray-500">
            © 2025 FuzzForge. Built with ❤️ for security researchers and developers.
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
