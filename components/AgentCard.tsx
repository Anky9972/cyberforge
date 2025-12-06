import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AgentCardProps {
  agentName: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  children: React.ReactNode;
}

const AgentCard: React.FC<AgentCardProps> = ({ agentName, icon, isLoading = false, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
      className="relative border border-white/10 rounded-2xl p-6 md:p-8 overflow-hidden group backdrop-blur-md bg-white/5"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Active Processing Pulse Background */}
      {isLoading && (
        <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
      )}

      {/* Internal Grid Pattern (Subtle) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>

      {/* Content Layer */}
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <motion.div
            className={`p-3 rounded-xl backdrop-blur-md shadow-lg border border-white/10 ${isLoading ? 'bg-blue-500/20' : 'bg-gray-800/50'}`}
            animate={isLoading ? {
              boxShadow: ["0 0 0px rgba(59,130,246,0)", "0 0 20px rgba(59,130,246,0.3)", "0 0 0px rgba(59,130,246,0)"]
            } : {}}
            transition={isLoading ? { duration: 2, repeat: Infinity } : {}}
          >
            {icon}
          </motion.div>

          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1 tracking-tight">{agentName}</h2>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 text-blue-400"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium tracking-wide uppercase">Processing...</span>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert max-w-none text-gray-300 text-sm md:text-base leading-relaxed"
        >
          {children}
        </motion.div>
      </div>

      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </motion.div>
  );
};

export default AgentCard;
