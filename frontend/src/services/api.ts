import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface StockAnalysis {
  ticker: string;
  timestamp: string;
  price: {
    current: number;
    previousClose: number;
    change1d: number;
    change1w?: number;
    change2w?: number;
    change1m?: number;
    change3m?: number;
    volume: number;
    avgVolume: number;
    volumeRatio: number;
  };
  classification?: {
    marketCap?: number;
    marketCapFormatted: string;
    category: 'nano' | 'micro' | 'small' | 'mid' | 'large' | 'mega';
    isPennyStock: boolean;
    riskLevel: string;
    suitableForLowCapital: boolean;
    suitabilityReason: string;
    capitalNeeded: string;
  };
  sentiment: {
    score: number;
    label: 'Very Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Very Bearish';
    confidence: number;
    mentionCount: number;
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    // Multi-source breakdown
    sources?: {
      twitter?: {
        score: number;
        mentions: number;
        confidence: number;
        weight: number;
      };
      alphaVantage?: {
        score: number;
        articles: number;
        confidence: number;
        weight: number;
      };
      reddit?: {
        score: number;
        posts: number;
        confidence: number;
        weight: number;
      };
    };
    sourcesUsed?: string[];
  };
  pump: {
    phase: 'early' | 'mid' | 'late' | 'post' | 'none';
    signal: 'green' | 'yellow' | 'red';
    confidence: number;
    reasoning: string[];
    summary: string;
  };
  topMentions: Array<{
    title: string;
    author: string;
    subreddit: string;
    upvotes: number;
    comments: number;
    url: string;
    sentiment: {
      score: number;
      label: 'positive' | 'neutral' | 'negative';
    };
    createdAt: string;
  }>;
}

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
  pickedAt: string;
  postUrl?: string;
  user?: TrackedUser;
}

/**
 * API client for stock sentiment analysis
 */
class ApiClient {
  /**
   * Analyze a single stock
   */
  async analyzeStock(ticker: string): Promise<StockAnalysis> {
    const response = await axios.get(`${API_BASE_URL}/stocks/${ticker}/analyze`);
    return response.data;
  }

  /**
   * Get stock price only
   */
  async getStockPrice(ticker: string) {
    const response = await axios.get(`${API_BASE_URL}/stocks/${ticker}/price`);
    return response.data;
  }

  /**
   * Get sentiment only
   */
  async getStockSentiment(ticker: string) {
    const response = await axios.get(`${API_BASE_URL}/stocks/${ticker}/sentiment`);
    return response.data;
  }

  /**
   * Batch analyze multiple stocks
   */
  async batchAnalyze(tickers: string[]) {
    const response = await axios.post(`${API_BASE_URL}/stocks/batch-analyze`, { tickers });
    return response.data;
  }

  /**
   * Get trending stocks
   */
  async getTrendingStocks() {
    const response = await axios.get(`${API_BASE_URL}/stocks/trending`);
    return response.data;
  }

  /**
   * Get top 3 most talked about stocks today
   */
  async getTopStocksToday() {
    const response = await axios.get(`${API_BASE_URL}/stocks/top-today`);
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await axios.get('http://localhost:5000/health');
    return response.data;
  }

  // ========== User Tracking API ==========

  /**
   * Get all tracked users
   */
  async getTrackedUsers(): Promise<{ users: TrackedUser[] }> {
    const response = await axios.get(`${API_BASE_URL}/users/tracked`);
    return response.data;
  }

  /**
   * Get top performing users
   */
  async getTopUsers(limit: number = 10): Promise<{ users: TrackedUser[] }> {
    const response = await axios.get(`${API_BASE_URL}/users/top?limit=${limit}`);
    return response.data;
  }

  /**
   * Add a user to track
   */
  async trackUser(data: {
    platform: string;
    username: string;
    displayName?: string;
  }): Promise<{ user: TrackedUser; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/users/track`, data);
    return response.data;
  }

  /**
   * Stop tracking a user
   */
  async untrackUser(platform: string, username: string): Promise<{ message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/users/track/${platform}/${username}`);
    return response.data;
  }

  /**
   * Get picks for a specific user
   */
  async getUserPicks(platform: string, username: string): Promise<{
    user: TrackedUser;
    picks: UserPick[];
  }> {
    const response = await axios.get(`${API_BASE_URL}/users/${platform}/${username}/picks`);
    return response.data;
  }

  /**
   * Get recent picks from all tracked users
   */
  async getRecentPicks(limit: number = 20): Promise<{ picks: UserPick[] }> {
    const response = await axios.get(`${API_BASE_URL}/users/picks/recent?limit=${limit}`);
    return response.data;
  }

  /**
   * Record a new pick for a tracked user
   */
  async recordPick(data: {
    platform: string;
    username: string;
    ticker: string;
    sentiment: string;
    entryPrice: number;
    pickedAt?: string;
    postUrl?: string;
  }): Promise<{ pick: UserPick; message: string }> {
    const response = await axios.post(`${API_BASE_URL}/users/picks`, data);
    return response.data;
  }

  /**
   * Get tracking statistics
   */
  async getTrackingStatistics(): Promise<{
    totalUsersTracked: number;
    totalPicks: number;
    overallAccuracy: number;
    topPerformer?: TrackedUser;
  }> {
    const response = await axios.get(`${API_BASE_URL}/users/statistics`);
    return response.data;
  }
}

export const api = new ApiClient();
