import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Lock, Search } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Initializing..." }) => {
  const icons = [
    { Icon: Shield, delay: 0, color: "text-blue-400" },
    { Icon: Zap, delay: 0.2, color: "text-yellow-400" },
    { Icon: Lock, delay: 0.4, color: "text-green-400" },
    { Icon: Search, delay: 0.6, color: "text-purple-400" }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl top-1/4 left-1/4 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl bottom-1/4 right-1/4 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 text-center">
        {/* Logo animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <Shield className="w-24 h-24 text-blue-500" />
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

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text"
        >
          FuzzForge
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 mb-8"
        >
          {message}
        </motion.p>

        {/* Animated icons */}
        <div className="flex justify-center gap-6 mb-8">
          {icons.map(({ Icon, delay, color }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: delay,
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1
              }}
              className={`${color}`}
            >
              <Icon className="w-8 h-8" />
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
