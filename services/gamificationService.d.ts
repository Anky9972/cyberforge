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
        streak: number;
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
declare class GamificationService {
    private achievements;
    constructor();
    /**
     * Initialize all achievements
     */
    private initializeAchievements;
    /**
     * Check and award achievements
     */
    checkAchievements(userProgress: UserProgress): Promise<string[]>;
    /**
     * Check if achievement requirement is met
     */
    private checkRequirement;
    /**
     * Award achievement to user
     */
    awardAchievement(userId: string, achievementId: string): Promise<Achievement | null>;
    /**
     * Calculate user level from points
     */
    calculateLevel(totalPoints: number): number;
    /**
     * Calculate points needed for next level
     */
    calculatePointsForNextLevel(currentLevel: number): number;
    /**
     * Get leaderboard
     */
    getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
    /**
     * Get user rank
     */
    getUserRank(userId: string): Promise<number>;
    /**
     * Get all achievements
     */
    getAllAchievements(): Achievement[];
    /**
     * Get achievement by ID
     */
    getAchievement(achievementId: string): Achievement | undefined;
    /**
     * Update user stats
     */
    updateStats(userId: string, update: Partial<UserProgress['stats']>): Promise<UserProgress>;
    /**
     * Get user progress
     */
    getUserProgress(userId: string): Promise<UserProgress>;
    /**
     * Get achievements summary for user
     */
    getAchievementsSummary(userId: string): Promise<{
        unlocked: Achievement[];
        locked: Achievement[];
        progress: {
            [key: string]: number;
        };
    }>;
    /**
     * Get current progress for requirement
     */
    private getCurrentProgress;
}
export declare const gamificationService: GamificationService;
export default GamificationService;
//# sourceMappingURL=gamificationService.d.ts.map