/**
 * User Tracking Service
 *
 * Tracks performance of specific influencers/advisors across platforms
 * Calculates accuracy rates, ROI, and reputation scores
 */

export interface TrackedUser {
  id: number;
  platform: 'reddit' | 'stocktwits' | 'twitter';
  username: string;
  displayName?: string;
  totalPicks: number;
  successfulPicks: number;
  failedPicks: number;
  accuracyRate: number;
  averageROI: number;
  reputationScore: number;
  trustLevel: 'unverified' | 'emerging' | 'trusted' | 'expert';
  isActive: boolean;
}

export interface UserPick {
  id: number;
  userId: number;
  ticker: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  entryPrice: number;
  currentPrice: number;
  peakPrice: number;
  lowestPrice: number;
  currentROI: number;
  peakROI: number;
  worstROI: number;
  outcome: 'pending' | 'successful' | 'failed' | 'neutral';
  pickedAt: Date;
  postUrl?: string;
}

/**
 * User Tracking Service
 *
 * In-memory implementation (no database required for MVP)
 * Can be upgraded to use PostgreSQL later via the schema we created
 */
export class UserTrackingService {
  // In-memory storage
  private trackedUsers: Map<string, TrackedUser> = new Map();
  private userPicks: Map<number, UserPick[]> = new Map();
  private nextUserId = 1;
  private nextPickId = 1;

  constructor() {
    // Initialize with some example tracked users for demo
    this.addTrackedUser({
      platform: 'reddit',
      username: 'DeepFuckingValue',
      displayName: 'Keith Gill (DFV)',
    });
  }

  /**
   * Add a user to track
   */
  addTrackedUser(data: {
    platform: 'reddit' | 'stocktwits' | 'twitter';
    username: string;
    displayName?: string;
  }): TrackedUser {
    const key = `${data.platform}:${data.username}`;

    // Check if already tracking
    if (this.trackedUsers.has(key)) {
      return this.trackedUsers.get(key)!;
    }

    const user: TrackedUser = {
      id: this.nextUserId++,
      platform: data.platform,
      username: data.username,
      displayName: data.displayName,
      totalPicks: 0,
      successfulPicks: 0,
      failedPicks: 0,
      accuracyRate: 0,
      averageROI: 0,
      reputationScore: 50, // Start at neutral 50/100
      trustLevel: 'unverified',
      isActive: true,
    };

    this.trackedUsers.set(key, user);
    this.userPicks.set(user.id, []);

    console.log(`✅ Now tracking ${data.username} on ${data.platform}`);
    return user;
  }

  /**
   * Record a pick made by a tracked user
   */
  recordPick(data: {
    platform: 'reddit' | 'stocktwits' | 'twitter';
    username: string;
    ticker: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    entryPrice: number;
    pickedAt: Date;
    postUrl?: string;
  }): UserPick | null {
    const key = `${data.platform}:${data.username}`;
    const user = this.trackedUsers.get(key);

    if (!user) {
      console.warn(`⚠️ User ${data.username} not being tracked`);
      return null;
    }

    const pick: UserPick = {
      id: this.nextPickId++,
      userId: user.id,
      ticker: data.ticker,
      sentiment: data.sentiment,
      entryPrice: data.entryPrice,
      currentPrice: data.entryPrice,
      peakPrice: data.entryPrice,
      lowestPrice: data.entryPrice,
      currentROI: 0,
      peakROI: 0,
      worstROI: 0,
      outcome: 'pending',
      pickedAt: data.pickedAt,
      postUrl: data.postUrl,
    };

    // Add to user's picks
    const userPicksList = this.userPicks.get(user.id) || [];
    userPicksList.push(pick);
    this.userPicks.set(user.id, userPicksList);

    // Update user stats
    user.totalPicks++;
    this.updateUserMetrics(user);

    console.log(`📝 Recorded ${data.sentiment} pick for ${data.ticker} by ${data.username}`);
    return pick;
  }

  /**
   * Update a pick with current price data
   */
  updatePickPrice(pickId: number, currentPrice: number): void {
    // Find the pick
    for (const picks of this.userPicks.values()) {
      const pick = picks.find(p => p.id === pickId);
      if (pick) {
        pick.currentPrice = currentPrice;

        // Update peak and lowest prices
        if (currentPrice > pick.peakPrice) {
          pick.peakPrice = currentPrice;
        }
        if (currentPrice < pick.lowestPrice) {
          pick.lowestPrice = currentPrice;
        }

        // Calculate ROI
        pick.currentROI = ((currentPrice - pick.entryPrice) / pick.entryPrice) * 100;
        pick.peakROI = ((pick.peakPrice - pick.entryPrice) / pick.entryPrice) * 100;
        pick.worstROI = ((pick.lowestPrice - pick.entryPrice) / pick.entryPrice) * 100;

        // Determine outcome (5% threshold for success/failure)
        if (pick.sentiment === 'bullish') {
          if (pick.peakROI >= 5) {
            pick.outcome = 'successful';
          } else if (pick.currentROI <= -5) {
            pick.outcome = 'failed';
          }
        } else if (pick.sentiment === 'bearish') {
          // For bearish picks, success = price going down
          if (pick.worstROI <= -5) {
            pick.outcome = 'successful';
          } else if (pick.currentROI >= 5) {
            pick.outcome = 'failed';
          }
        }

        // Update user metrics
        const user = this.getUserById(pick.userId);
        if (user) {
          this.updateUserMetrics(user);
        }

        return;
      }
    }
  }

  /**
   * Update user's performance metrics
   */
  private updateUserMetrics(user: TrackedUser): void {
    const picks = this.userPicks.get(user.id) || [];

    if (picks.length === 0) return;

    // Count outcomes
    user.successfulPicks = picks.filter(p => p.outcome === 'successful').length;
    user.failedPicks = picks.filter(p => p.outcome === 'failed').length;

    // Calculate accuracy rate
    const resolvedPicks = user.successfulPicks + user.failedPicks;
    user.accuracyRate = resolvedPicks > 0 ? (user.successfulPicks / resolvedPicks) * 100 : 0;

    // Calculate average ROI (only for bullish picks for simplicity)
    const bullishPicks = picks.filter(p => p.sentiment === 'bullish');
    if (bullishPicks.length > 0) {
      const totalROI = bullishPicks.reduce((sum, p) => sum + p.currentROI, 0);
      user.averageROI = totalROI / bullishPicks.length;
    }

    // Calculate reputation score (0-100)
    // Factors: accuracy rate (50%), average ROI (30%), total picks (20%)
    const accuracyScore = user.accuracyRate * 0.5;
    const roiScore = Math.min(Math.max(user.averageROI * 2, 0), 50) * 0.3; // Cap ROI contribution
    const volumeScore = Math.min(user.totalPicks / 20, 1) * 20 * 0.2; // Max at 20 picks

    user.reputationScore = accuracyScore + roiScore + volumeScore;

    // Determine trust level
    if (user.reputationScore >= 80 && user.totalPicks >= 20) {
      user.trustLevel = 'expert';
    } else if (user.reputationScore >= 65 && user.totalPicks >= 10) {
      user.trustLevel = 'trusted';
    } else if (user.reputationScore >= 50 && user.totalPicks >= 5) {
      user.trustLevel = 'emerging';
    } else {
      user.trustLevel = 'unverified';
    }
  }

  /**
   * Get all tracked users
   */
  getAllTrackedUsers(): TrackedUser[] {
    return Array.from(this.trackedUsers.values())
      .filter(u => u.isActive)
      .sort((a, b) => b.reputationScore - a.reputationScore); // Sort by reputation
  }

  /**
   * Get top performing users
   */
  getTopUsers(limit: number = 10): TrackedUser[] {
    return this.getAllTrackedUsers().slice(0, limit);
  }

  /**
   * Get a specific user
   */
  getUser(platform: string, username: string): TrackedUser | undefined {
    const key = `${platform}:${username}`;
    return this.trackedUsers.get(key);
  }

  /**
   * Get user by ID
   */
  private getUserById(id: number): TrackedUser | undefined {
    return Array.from(this.trackedUsers.values()).find(u => u.id === id);
  }

  /**
   * Get all picks for a user
   */
  getUserPicks(userId: number): UserPick[] {
    return this.userPicks.get(userId) || [];
  }

  /**
   * Get recent picks across all tracked users
   */
  getRecentPicks(limit: number = 20): Array<UserPick & { user: TrackedUser }> {
    const allPicks: Array<UserPick & { user: TrackedUser }> = [];

    for (const [userId, picks] of this.userPicks.entries()) {
      const user = this.getUserById(userId);
      if (user) {
        picks.forEach(pick => {
          allPicks.push({ ...pick, user });
        });
      }
    }

    // Sort by picked date (newest first)
    allPicks.sort((a, b) => b.pickedAt.getTime() - a.pickedAt.getTime());

    return allPicks.slice(0, limit);
  }

  /**
   * Remove a user from tracking
   */
  removeTrackedUser(platform: string, username: string): boolean {
    const key = `${platform}:${username}`;
    const user = this.trackedUsers.get(key);

    if (!user) return false;

    user.isActive = false;
    console.log(`❌ Stopped tracking ${username} on ${platform}`);
    return true;
  }

  /**
   * Get statistics summary
   */
  getStatistics(): {
    totalUsersTracked: number;
    totalPicks: number;
    overallAccuracy: number;
    topPerformer?: TrackedUser;
  } {
    const users = this.getAllTrackedUsers();
    const totalPicks = users.reduce((sum, u) => sum + u.totalPicks, 0);
    const totalSuccessful = users.reduce((sum, u) => sum + u.successfulPicks, 0);
    const totalResolved = users.reduce((sum, u) => sum + u.successfulPicks + u.failedPicks, 0);

    return {
      totalUsersTracked: users.length,
      totalPicks,
      overallAccuracy: totalResolved > 0 ? (totalSuccessful / totalResolved) * 100 : 0,
      topPerformer: users[0], // Already sorted by reputation
    };
  }
}

// Export singleton instance
export const userTrackingService = new UserTrackingService();
