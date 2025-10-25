import axios from 'axios';
import NodeCache from 'node-cache';

/**
 * Alpha Vantage news article structure
 */
export interface NewsArticle {
  title: string;
  url: string;
  time_published: string; // Format: 20251024T103000
  authors: string[];
  summary: string;
  banner_image?: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: Array<{
    topic: string;
    relevance_score: string;
  }>;
  overall_sentiment_score: number; // -1 to 1
  overall_sentiment_label: string; // Bearish, Somewhat-Bearish, Neutral, Somewhat-Bullish, Bullish
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: string; // "0" to "1"
    ticker_sentiment_score: string; // "-1" to "1"
    ticker_sentiment_label: string;
  }>;
}

export interface AlphaVantageNewsResponse {
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: NewsArticle[];
}

/**
 * Alpha Vantage News & Sentiment API Service
 *
 * Provides news articles with AI-powered sentiment analysis
 * Free tier: 25 API calls per day, 5 calls per minute
 *
 * Get free API key: https://www.alphavantage.co/support/#api-key
 */
export class AlphaVantageService {
  private cache: NodeCache;
  private readonly baseUrl = 'https://www.alphavantage.co/query';
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    // Cache responses for 2 hours (news updates frequently but API is rate limited)
    this.cache = new NodeCache({ stdTTL: 7200 });

    // Get API key from environment or parameter
    this.apiKey = apiKey || process.env.ALPHA_VANTAGE_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ Alpha Vantage API key not configured. News sentiment will be unavailable.');
      console.warn('   Get a free key at https://www.alphavantage.co/support/#api-key');
      console.warn('   Set ALPHA_VANTAGE_API_KEY in your .env file');
    }
  }

  /**
   * Check if Alpha Vantage is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Fetch news sentiment for a stock ticker
   */
  async fetchNewsSentiment(
    ticker: string,
    limit: number = 50,
    options?: {
      timeFrom?: string; // Format: 20251024T0000
      timeTo?: string;
      topics?: string; // e.g., 'earnings,technology'
      sort?: 'LATEST' | 'EARLIEST' | 'RELEVANCE';
    }
  ): Promise<AlphaVantageNewsResponse | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const cacheKey = `alpha-vantage:${ticker}:${limit}`;
    const cached = this.cache.get<AlphaVantageNewsResponse>(cacheKey);

    if (cached) {
      console.log(`✅ Alpha Vantage cache hit for ${ticker}`);
      return cached;
    }

    console.log(`🔍 Fetching Alpha Vantage news sentiment for ${ticker}...`);

    try {
      const params: any = {
        function: 'NEWS_SENTIMENT',
        tickers: ticker.toUpperCase(),
        limit: Math.min(limit, 1000), // Max 1000
        apikey: this.apiKey,
        sort: options?.sort || 'LATEST',
      };

      if (options?.timeFrom) params.time_from = options.timeFrom;
      if (options?.timeTo) params.time_to = options.timeTo;
      if (options?.topics) params.topics = options.topics;

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 15000, // 15 second timeout
      });

      const data: AlphaVantageNewsResponse = response.data;

      if (data && data.feed && data.feed.length > 0) {
        this.cache.set(cacheKey, data);
        console.log(`✅ Fetched ${data.feed.length} news articles from Alpha Vantage`);
        return data;
      } else {
        console.log(`⚠️ No news articles available for ${ticker}`);
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error('❌ Alpha Vantage rate limit exceeded (5/min or 25/day)');
      } else if (error.response?.data?.Note) {
        console.error('❌ Alpha Vantage API limit:', error.response.data.Note);
      } else {
        console.error(`Error fetching Alpha Vantage data for ${ticker}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Get aggregated news sentiment for a ticker
   */
  async getAggregatedSentiment(ticker: string, limit: number = 50): Promise<{
    averageSentiment: number;
    sentimentLabel: string;
    articleCount: number;
    relevantArticleCount: number;
    averageRelevance: number;
    confidence: number;
    recentArticles: Array<{
      title: string;
      url: string;
      published: Date;
      sentiment: number;
      relevance: number;
      source: string;
    }>;
  } | null> {
    const response = await this.fetchNewsSentiment(ticker, limit);

    if (!response || !response.feed || response.feed.length === 0) {
      return null;
    }

    const ticker Upper = ticker.toUpperCase();

    // Filter and process articles
    const relevantArticles = response.feed
      .map(article => {
        // Find ticker-specific sentiment
        const tickerSentiment = article.ticker_sentiment.find(
          ts => ts.ticker.toUpperCase() === tickerUpper
        );

        if (!tickerSentiment) return null;

        return {
          title: article.title,
          url: article.url,
          published: this.parseTimestamp(article.time_published),
          sentiment: parseFloat(tickerSentiment.ticker_sentiment_score),
          relevance: parseFloat(tickerSentiment.relevance_score),
          source: article.source,
          overallSentiment: article.overall_sentiment_score,
        };
      })
      .filter(a => a !== null && a.relevance > 0.3); // Filter by relevance threshold

    if (relevantArticles.length === 0) {
      return null;
    }

    // Calculate weighted average sentiment (by relevance)
    let weightedSentimentSum = 0;
    let totalWeight = 0;

    for (const article of relevantArticles) {
      const weight = article.relevance;
      weightedSentimentSum += article.sentiment * weight;
      totalWeight += weight;
    }

    const averageSentiment = totalWeight > 0 ? weightedSentimentSum / totalWeight : 0;
    const averageRelevance = relevantArticles.reduce((sum, a) => sum + a.relevance, 0) / relevantArticles.length;

    // Calculate confidence based on article count and relevance
    const articleCountFactor = Math.min(relevantArticles.length / 20, 1.0); // 20+ articles = max
    const relevanceFactor = averageRelevance;
    const confidence = (articleCountFactor * 0.5) + (relevanceFactor * 0.5);

    return {
      averageSentiment,
      sentimentLabel: this.labelSentiment(averageSentiment),
      articleCount: response.feed.length,
      relevantArticleCount: relevantArticles.length,
      averageRelevance,
      confidence,
      recentArticles: relevantArticles.slice(0, 10).map(a => ({
        title: a.title,
        url: a.url,
        published: a.published,
        sentiment: a.sentiment,
        relevance: a.relevance,
        source: a.source,
      })),
    };
  }

  /**
   * Parse Alpha Vantage timestamp format
   */
  private parseTimestamp(timeStr: string): Date {
    // Format: 20251024T103000
    const year = parseInt(timeStr.substring(0, 4));
    const month = parseInt(timeStr.substring(4, 6)) - 1; // JS months are 0-indexed
    const day = parseInt(timeStr.substring(6, 8));
    const hour = parseInt(timeStr.substring(9, 11));
    const minute = parseInt(timeStr.substring(11, 13));
    const second = parseInt(timeStr.substring(13, 15));

    return new Date(year, month, day, hour, minute, second);
  }

  /**
   * Convert numeric sentiment to label
   */
  private labelSentiment(score: number): string {
    if (score > 0.35) return 'Bullish';
    if (score > 0.15) return 'Somewhat-Bullish';
    if (score >= -0.15) return 'Neutral';
    if (score >= -0.35) return 'Somewhat-Bearish';
    return 'Bearish';
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
export const alphaVantageService = new AlphaVantageService();
