import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Star, Target, TrendingUp, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  unlockedAt?: string;
}

interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  vulnerabilitiesFound: number;
  scansDone: number;
  criticalIssuesFixed: number;
  streak: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  level: number;
  xp: number;
  achievements: number;
}

export const GamificationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGamificationData();
  }, [user]);

  const loadGamificationData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load achievements
      const achievementsRes = await fetch('/api/gamification/achievements', { headers });
      if (achievementsRes.ok) {
        const data = await achievementsRes.json();
        setAchievements([...data.unlocked, ...data.locked]);
      }

      // Load progress
      const progressRes = await fetch('/api/gamification/progress', { headers });
      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(data);
      }

      // Load leaderboard
      const leaderboardRes = await fetch('/api/gamification/leaderboard?limit=10', { headers });
      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-800';
      case 'silver': return 'from-gray-300 to-gray-500';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-cyan-400 to-blue-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return Award;
      case 'silver': return Star;
      case 'gold': return Trophy;
      case 'platinum': return Target;
      default: return Lock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Your Progress
          </h1>
          <p className="text-gray-400">Track your achievements and compete with others</p>
        </div>

        {/* Progress Card */}
        {progress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Level {progress.level}</h2>
                <p className="text-gray-400">{progress.xp} / {progress.xpToNextLevel} XP</p>
              </div>
              <TrendingUp className="w-12 h-12 text-cyan-500" />
            </div>
            
            {/* XP Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-3 mb-6">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(progress.xp / progress.xpToNextLevel) * 100}%` }}
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Vulnerabilities Found</p>
                <p className="text-2xl font-bold text-white">{progress.vulnerabilitiesFound}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Scans Completed</p>
                <p className="text-2xl font-bold text-white">{progress.scansDone}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Critical Fixes</p>
                <p className="text-2xl font-bold text-white">{progress.criticalIssuesFixed}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Current Streak</p>
                <p className="text-2xl font-bold text-white">{progress.streak} days</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Achievements */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-4">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => {
                const Icon = getTierIcon(achievement.tier);
                const isUnlocked = !!achievement.unlockedAt;
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative overflow-hidden rounded-xl border ${
                      isUnlocked 
                        ? 'bg-gradient-to-br ' + getTierColor(achievement.tier) + ' border-transparent' 
                        : 'bg-gray-800/50 border-gray-700'
                    } p-6`}
                  >
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Lock className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex items-start space-x-4">
                      <Icon className={`w-12 h-12 ${isUnlocked ? 'text-white' : 'text-gray-600'}`} />
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm ${isUnlocked ? 'text-white/80' : 'text-gray-500'}`}>
                          {achievement.description}
                        </p>
                        {achievement.unlockedAt && (
                          <p className="text-xs text-white/60 mt-2">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Leaderboard</h2>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-4 p-3 rounded-lg ${
                      entry.userId === user?.id ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-gray-900/50'
                    }`}
                  >
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-amber-600' :
                      'text-gray-500'
                    }`}>
                      {entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{entry.userName}</p>
                      <p className="text-sm text-gray-400">
                        Level {entry.level} • {entry.xp} XP
                      </p>
                    </div>
                    <Trophy className={`w-6 h-6 ${
                      index === 0 ? 'text-yellow-400' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-amber-600' :
                      'text-gray-600'
                    }`} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
