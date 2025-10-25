import axios from 'axios';
import NodeCache from 'node-cache';

/**
 * Finnhub social sentiment data structure
 */
export interface FinnhubSentimentData {
  atTime: string; // ISO timestamp
  mention: number; // Total mentions
  positiveMention: number;
  negativeMention: number;
  positiveScore: number; // 0 to 1
  negativeScore: number; // 0 to 1
  score: number; // -1 (negative) to 1 (positive)
}

export interface FinnhubSentimentResponse {
  symbol: string;
  data: FinnhubSentimentData[];
}

/**
 * Finnhub API Service
 *
 * Provides aggregated social sentiment from Reddit and Twitter
 * Free tier: 60 API calls per minute, unlimited daily
 *
 * Get free API key: https://finnhub.io/register
 */
export class FinnhubService {
  private cache: NodeCache;
  private readonly baseUrl = 'https://finnhub.io/api/v1';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    // Cache responses for 1 hour (Finnhub data updates daily)
    this.cache = new NodeCache({ stdTTL: 3600 });

    // Get API key from environment or parameter
    this.apiKey = apiKey || process.env.FINNHUB_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ Finnhub API key not configured. Social sentiment from Twitter/Reddit will be unavailable.');
      console.warn('   Get a free key at https://finnhub.io/register');
      console.warn('   Set FINNHUB_API_KEY in your .env file');
    }
  }

  /**
   * Check if Finnhub is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Fetch social sentiment for a stock ticker
   * Returns aggregated sentiment from Reddit and Twitter
   */
  async fetchSocialSentiment(ticker: string): Promise<FinnhubSentimentResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const cacheKey = `finnhub:${ticker}`;
    const cached = this.cache.get<FinnhubSentimentResponse>(cacheKey);

    if (cached) {
      console.log(`✅ Finnhub cache hit for ${ticker}`);
      return cached;
    }

    console.log(`🔍 Fetching Finnhub social sentiment for ${ticker}...`);

    try {
      const url = `${this.baseUrl}/stock/social-sentiment`;

      const response = await axios.get(url, {
        params: {
          symbol: ticker.toUpperCase(),
          token: this.apiKey,
        },
        headers: {
          'X-Finnhub-Token': this.apiKey,
        },
        timeout: 10000,
      });

      const data: FinnhubSentimentResponse = response.data;

      if (data && data.data && data.data.length > 0) {
        this.cache.set(cacheKey, data);
        console.log(`✅ Fetched ${data.data.length} days of social sentiment from Finnhub`);
        return data;
      } else {
        console.log(`⚠️ No Finnhub data available for ${ticker}`);
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error('❌ Finnhub rate limit exceeded (60/min)');
      } else if (error.response?.status === 403) {
        console.error('❌ Finnhub API key invalid or unauthorized');
      } else {
        console.error(`Error fetching Finnhub data for ${ticker}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Get the most recent sentiment data point
   */
  async getLatestSentiment(ticker: string): Promise<FinnhubSentimentData | null> {
    const response = await this.fetchSocialSentiment(ticker);

    if (!response || !response.data || response.data.length === 0) {
      return null;
    }

    // Return most recent entry (first in array)
    return response.data[0];
  }

  /**
   * Calculate average sentiment over time period
   */
  async getAverageSentiment(ticker: string, days: number = 7): Promise<{
    averageScore: number;
    totalMentions: number;
    positiveMentions: number;
    negativeMentions: number;
    confidence: number;
  } | null> {
    const response = await this.fetchSocialSentiment(ticker);

    if (!response || !response.data || response.data.length === 0) {
      return null;
    }

    // Take last N days of data
    const recentData = response.data.slice(0, days);

    const totalMentions = recentData.reduce((sum, d) => sum + d.mention, 0);
    const positiveMentions = recentData.reduce((sum, d) => sum + d.positiveMention, 0);
    const negativeMentions = recentData.reduce((sum, d) => sum + d.negativeMention, 0);

    // Weighted average by mention count
    let weightedScoreSum = 0;
    let totalWeight = 0;

    for (const dataPoint of recentData) {
      const weight = dataPoint.mention;
      weightedScoreSum += dataPoint.score * weight;
      totalWeight += weight;
    }

    const averageScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;

    // Calculate confidence based on volume
    // More mentions = higher confidence
    const confidence = Math.min(totalMentions / 1000, 1.0);

    return {
      averageScore,
      totalMentions,
      positiveMentions,
      negativeMentions,
      confidence,
    };
  }

  /**
   * Clear cache for a specific ticker or all
   */
  clearCache(ticker?: string) {
    if (ticker) {
      const keys = this.cache.keys().filter(key => key.includes(ticker));
      this.cache.del(keys);
    } else {
      this.cache.flushAll();
    }
  }
}

// Export singleton instance
export const finnhubService = new FinnhubService();
