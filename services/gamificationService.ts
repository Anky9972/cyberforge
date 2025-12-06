/**
 * Gamification System Service
 * Implements achievements, leaderboards, and progress tracking
 */

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: {
    type: string;
    threshold: number;
  };
}

interface UserProgress {
  userId: string;
  totalPoints: number;
  level: number;
  achievements: string[];
  stats: {
    vulnerabilitiesFound: number;
    criticalVulnerabilitiesFound: number;
    codeScanned: number;
    fixesApplied: number;
    scansDone: number;
    helpedOthers: number;
    streak: number; // consecutive days
  };
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  level: number;
  achievementCount: number;
  rank: number;
}

class GamificationService {
  private achievements: Map<string, Achievement> = new Map();

  constructor() {
    this.initializeAchievements();
  }

  /**
   * Initialize all achievements
   */
  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      // Beginner Achievements
      {
        id: 'first_blood',
        title: '🩸 First Blood',
        description: 'Found your first vulnerability',
        icon: '🔍',
        points: 10,
        tier: 'bronze',
        requirement: { type: 'vulnerabilities_found', threshold: 1 }
      },
      {
        id: 'scanner',
        title: '📡 Scanner',
        description: 'Completed your first security scan',
        icon: '🔬',
        points: 5,
        tier: 'bronze',
        requirement: { type: 'scans_done', threshold: 1 }
      },
      {
        id: 'fixer',
        title: '🔧 Fixer',
        description: 'Applied your first auto-fix',
        icon: '✅',
        points: 15,
        tier: 'bronze',
        requirement: { type: 'fixes_applied', threshold: 1 }
      },

      // Intermediate Achievements
      {
        id: 'bug_hunter',
        title: '🐛 Bug Hunter',
        description: 'Found 10 vulnerabilities',
        icon: '🎯',
        points: 50,
        tier: 'silver',
        requirement: { type: 'vulnerabilities_found', threshold: 10 }
      },
      {
        id: 'critical_finder',
        title: '💥 Critical Finder',
        description: 'Found 5 critical vulnerabilities',
        icon: '⚠️',
        points: 100,
        tier: 'silver',
        requirement: { type: 'critical_vulnerabilities', threshold: 5 }
      },
      {
        id: 'code_warrior',
        title: '⚔️ Code Warrior',
        description: 'Scanned 100,000 lines of code',
        icon: '📝',
        points: 75,
        tier: 'silver',
        requirement: { type: 'code_scanned', threshold: 100000 }
      },
      {
        id: 'week_streak',
        title: '🔥 Week Streak',
        description: 'Used CyberForge for 7 consecutive days',
        icon: '📅',
        points: 50,
        tier: 'silver',
        requirement: { type: 'streak', threshold: 7 }
      },

      // Advanced Achievements
      {
        id: 'elite_hunter',
        title: '👑 Elite Hunter',
        description: 'Found 100 vulnerabilities',
        icon: '🏆',
        points: 200,
        tier: 'gold',
        requirement: { type: 'vulnerabilities_found', threshold: 100 }
      },
      {
        id: 'zero_day',
        title: '🎖️ Zero Day',
        description: 'Discovered a previously unknown CVE',
        icon: '💎',
        points: 500,
        tier: 'gold',
        requirement: { type: 'zero_day_found', threshold: 1 }
      },
      {
        id: 'speed_demon',
        title: '⚡ Speed Demon',
        description: 'Analyzed 100 repositories in 24 hours',
        icon: '🚀',
        points: 150,
        tier: 'gold',
        requirement: { type: 'repos_per_day', threshold: 100 }
      },
      {
        id: 'mentor',
        title: '👨‍🏫 Mentor',
        description: 'Helped 5 developers fix security issues',
        icon: '🎓',
        points: 200,
        tier: 'gold',
        requirement: { type: 'helped_others', threshold: 5 }
      },

      // Master Achievements
      {
        id: 'legend',
        title: '🌟 Legend',
        description: 'Found 1000 vulnerabilities',
        icon: '👾',
        points: 1000,
        tier: 'platinum',
        requirement: { type: 'vulnerabilities_found', threshold: 1000 }
      },
      {
        id: 'guardian',
        title: '🛡️ Guardian',
        description: 'Prevented 100 critical vulnerabilities',
        icon: '🔒',
        points: 1000,
        tier: 'platinum',
        requirement: { type: 'critical_vulnerabilities', threshold: 100 }
      },
      {
        id: 'master_fixer',
        title: '🔮 Master Fixer',
        description: 'Applied 500 auto-fixes',
        icon: '✨',
        points: 750,
        tier: 'platinum',
        requirement: { type: 'fixes_applied', threshold: 500 }
      }
    ];

    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });

    console.log(`✅ Initialized ${achievements.length} achievements`);
  }

  /**
   * Check and award achievements
   */
  async checkAchievements(userProgress: UserProgress): Promise<string[]> {
    const newlyUnlocked: string[] = [];

    for (const [achievementId, achievement] of this.achievements) {
      // Skip if already unlocked
      if (userProgress.achievements.includes(achievementId)) {
        continue;
      }

      // Check if requirement is met
      const isMet = this.checkRequirement(achievement.requirement, userProgress.stats);

      if (isMet) {
        newlyUnlocked.push(achievementId);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Check if achievement requirement is met
   */
  private checkRequirement(
    requirement: { type: string; threshold: number },
    stats: UserProgress['stats']
  ): boolean {
    switch (requirement.type) {
      case 'vulnerabilities_found':
        return stats.vulnerabilitiesFound >= requirement.threshold;
      
      case 'critical_vulnerabilities':
        return stats.criticalVulnerabilitiesFound >= requirement.threshold;
      
      case 'code_scanned':
        return stats.codeScanned >= requirement.threshold;
      
      case 'fixes_applied':
        return stats.fixesApplied >= requirement.threshold;
      
      case 'scans_done':
        return stats.scansDone >= requirement.threshold;
      
      case 'helped_others':
        return stats.helpedOthers >= requirement.threshold;
      
      case 'streak':
        return stats.streak >= requirement.threshold;
      
      default:
        return false;
    }
  }

  /**
   * Award achievement to user
   */
  async awardAchievement(userId: string, achievementId: string): Promise<Achievement | null> {
    const achievement = this.achievements.get(achievementId);
    
    if (!achievement) {
      return null;
    }

    // In production, save to database
    console.log(`🏆 Achievement unlocked for ${userId}: ${achievement.title}`);

    return achievement;
  }

  /**
   * Calculate user level from points
   */
  calculateLevel(totalPoints: number): number {
    // Level formula: level = floor(sqrt(points / 100))
    return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
  }

  /**
   * Calculate points needed for next level
   */
  calculatePointsForNextLevel(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    return (nextLevel - 1) ** 2 * 100;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    // In production, query from database with proper pagination
    // For now, return mock data structure
    
    const mockLeaderboard: LeaderboardEntry[] = [
      {
        userId: '1',
        username: 'SecurityNinja',
        totalPoints: 2500,
        level: 5,
        achievementCount: 15,
        rank: 1
      },
      {
        userId: '2',
        username: 'BugDestroyer',
        totalPoints: 2100,
        level: 4,
        achievementCount: 12,
        rank: 2
      }
    ];

    return mockLeaderboard.slice(0, limit);
  }

  /**
   * Get user rank
   */
  async getUserRank(userId: string): Promise<number> {
    // In production, query from database
    return 1;
  }

  /**
   * Get all achievements
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get achievement by ID
   */
  getAchievement(achievementId: string): Achievement | undefined {
    return this.achievements.get(achievementId);
  }

  /**
   * Update user stats
   */
  async updateStats(
    userId: string,
    update: Partial<UserProgress['stats']>
  ): Promise<UserProgress> {
    // In production, update database
    
    // Mock implementation
    const currentProgress: UserProgress = {
      userId,
      totalPoints: 100,
      level: 1,
      achievements: [],
      stats: {
        vulnerabilitiesFound: 0,
        criticalVulnerabilitiesFound: 0,
        codeScanned: 0,
        fixesApplied: 0,
        scansDone: 0,
        helpedOthers: 0,
        streak: 1
      }
    };

    // Update stats
    Object.assign(currentProgress.stats, update);

    // Check for new achievements
    const newAchievements = await this.checkAchievements(currentProgress);

    // Award new achievements
    for (const achievementId of newAchievements) {
      const achievement = await this.awardAchievement(userId, achievementId);
      if (achievement) {
        currentProgress.achievements.push(achievementId);
        currentProgress.totalPoints += achievement.points;
      }
    }

    // Recalculate level
    currentProgress.level = this.calculateLevel(currentProgress.totalPoints);

    return currentProgress;
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    // In production, fetch from database
    
    return {
      userId,
      totalPoints: 0,
      level: 1,
      achievements: [],
      stats: {
        vulnerabilitiesFound: 0,
        criticalVulnerabilitiesFound: 0,
        codeScanned: 0,
        fixesApplied: 0,
        scansDone: 0,
        helpedOthers: 0,
        streak: 0
      }
    };
  }

  /**
   * Get achievements summary for user
   */
  async getAchievementsSummary(userId: string): Promise<{
    unlocked: Achievement[];
    locked: Achievement[];
    progress: { [key: string]: number };
  }> {
    const userProgress = await this.getUserProgress(userId);
    const allAchievements = this.getAllAchievements();

    const unlocked = allAchievements.filter(a => 
      userProgress.achievements.includes(a.id)
    );

    const locked = allAchievements.filter(a => 
      !userProgress.achievements.includes(a.id)
    );

    // Calculate progress for locked achievements
    const progress: { [key: string]: number } = {};
    for (const achievement of locked) {
      const current = this.getCurrentProgress(achievement.requirement, userProgress.stats);
      const percent = (current / achievement.requirement.threshold) * 100;
      progress[achievement.id] = Math.min(percent, 100);
    }

    return {
      unlocked,
      locked,
      progress
    };
  }

  /**
   * Get current progress for requirement
   */
  private getCurrentProgress(
    requirement: { type: string; threshold: number },
    stats: UserProgress['stats']
  ): number {
    switch (requirement.type) {
      case 'vulnerabilities_found':
        return stats.vulnerabilitiesFound;
      case 'critical_vulnerabilities':
        return stats.criticalVulnerabilitiesFound;
      case 'code_scanned':
        return stats.codeScanned;
      case 'fixes_applied':
        return stats.fixesApplied;
      case 'scans_done':
        return stats.scansDone;
      case 'helped_others':
        return stats.helpedOthers;
      case 'streak':
        return stats.streak;
      default:
        return 0;
    }
  }
}

export const gamificationService = new GamificationService();
export default GamificationService;
