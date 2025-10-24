import axios from 'axios';
import NodeCache from 'node-cache';

/**
 * Reddit post data structure
 */
export interface RedditPost {
  id: string;
  title: string;
  content: string; // selftext
  author: string;
  subreddit: string;
  url: string;
  upvotes: number;
  comments: number;
  createdAt: Date;
  weight?: number; // Subreddit weight for scoring
  category?: 'penny' | 'general'; // Subreddit category
}

/**
 * Reddit API Service
 *
 * Fetches stock mentions from Reddit using the public JSON API
 * No authentication required for basic read access
 *
 * Rate limits: ~60 requests per minute (unofficial)
 */
export class RedditService {
  private cache: NodeCache;
  private readonly baseUrl = 'https://www.reddit.com';

  // Weighted subreddits for stock discussions
  // Higher weight = more influence on sentiment scoring
  private readonly targetSubreddits = [
    // Penny Stock Focused (Higher weight - your focus area)
    { name: 'pennystocks', weight: 3.0, category: 'penny' },
    { name: 'RobinHoodPennyStocks', weight: 2.5, category: 'penny' },
    { name: 'Shortsqueeze', weight: 2.5, category: 'penny' },
    { name: 'smallstreetbets', weight: 2.0, category: 'penny' },

    // High Volume Retail Trading (Medium-high weight)
    { name: 'wallstreetbets', weight: 2.0, category: 'general' },
    { name: 'WallStreetbetsELITE', weight: 1.5, category: 'general' },

    // General Trading (Standard weight)
    { name: 'stocks', weight: 1.0, category: 'general' },
    { name: 'investing', weight: 1.0, category: 'general' },
    { name: 'StockMarket', weight: 1.0, category: 'general' },
    { name: 'options', weight: 1.0, category: 'general' },
    { name: 'Daytrading', weight: 1.0, category: 'general' },

    // Swing/Momentum Trading (Medium weight)
    { name: 'swingtrading', weight: 1.5, category: 'general' },
    { name: 'Trading', weight: 1.0, category: 'general' },
  ];

  constructor() {
    // Cache responses for 5 minutes
    this.cache = new NodeCache({ stdTTL: 300 });
  }

  /**
   * Fetch posts mentioning a specific stock ticker
   */
  async fetchStockMentions(ticker: string, limit: number = 50): Promise<RedditPost[]> {
    const cacheKey = `reddit:${ticker}:${limit}`;
    const cached = this.cache.get<RedditPost[]>(cacheKey);

    if (cached) {
      console.log(`✅ Reddit cache hit for ${ticker}`);
      return cached;
    }

    console.log(`🔍 Fetching Reddit mentions for ${ticker}...`);

    const allPosts: RedditPost[] = [];

    // Search across multiple subreddits
    for (const subreddit of this.targetSubreddits) {
      try {
        const posts = await this.searchSubreddit(
          subreddit.name,
          ticker,
          Math.ceil(limit / this.targetSubreddits.length)
        );
        // Add weight and category to posts
        const weightedPosts = posts.map(post => ({
          ...post,
          weight: subreddit.weight,
          category: subreddit.category,
        }));
        allPosts.push(...weightedPosts);
      } catch (error) {
        console.error(`Error fetching from r/${subreddit.name}:`, error);
      }
    }

    // Sort by weighted score (upvotes * weight)
    allPosts.sort((a, b) => {
      const scoreA = a.upvotes * (a.weight || 1);
      const scoreB = b.upvotes * (b.weight || 1);
      return scoreB - scoreA;
    });

    // Limit total results
    const results = allPosts.slice(0, limit);

    this.cache.set(cacheKey, results);
    console.log(`✅ Found ${results.length} Reddit posts mentioning ${ticker}`);

    return results;
  }

  /**
   * Search a specific subreddit for ticker mentions
   */
  private async searchSubreddit(subreddit: string, ticker: string, limit: number = 25): Promise<RedditPost[]> {
    try {
      // Use Reddit's JSON API (append .json to any URL)
      const searchUrl = `${this.baseUrl}/r/${subreddit}/search.json`;

      const response = await axios.get(searchUrl, {
        params: {
          q: `$${ticker} OR ${ticker}`, // Search for "$NVDA" or "NVDA"
          restrict_sr: 'on', // Restrict to this subreddit
          sort: 'new', // Get recent posts
          limit: limit,
          t: 'week', // Time filter: past week
        },
        headers: {
          'User-Agent': 'StockSentimentAnalyzer/1.0',
        },
        timeout: 10000, // 10 second timeout
      });

      const posts = response.data?.data?.children || [];

      return posts.map((post: any) => this.parseRedditPost(post.data)).filter(Boolean);
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn(`⚠️ Rate limited by Reddit for r/${subreddit}`);
      } else {
        console.error(`Error searching r/${subreddit}:`, error.message);
      }
      return [];
    }
  }

  /**
   * Get hot/trending posts from a subreddit
   */
  async fetchHotPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
    try {
      const url = `${this.baseUrl}/r/${subreddit}/hot.json`;

      const response = await axios.get(url, {
        params: { limit },
        headers: {
          'User-Agent': 'StockSentimentAnalyzer/1.0',
        },
        timeout: 10000,
      });

      const posts = response.data?.data?.children || [];

      return posts.map((post: any) => this.parseRedditPost(post.data)).filter(Boolean);
    } catch (error: any) {
      console.error(`Error fetching hot posts from r/${subreddit}:`, error.message);
      return [];
    }
  }

  /**
   * Parse raw Reddit API response into RedditPost
   */
  private parseRedditPost(data: any): RedditPost | null {
    if (!data) return null;

    return {
      id: data.id,
      title: data.title || '',
      content: data.selftext || '',
      author: data.author || '[deleted]',
      subreddit: data.subreddit || '',
      url: `https://www.reddit.com${data.permalink}`,
      upvotes: data.ups || 0,
      comments: data.num_comments || 0,
      createdAt: new Date(data.created_utc * 1000),
    };
  }

  /**
   * Scan all target subreddits for any stock ticker mentions
   * Returns map of ticker -> posts
   */
  async scanAllSubreddits(): Promise<Map<string, RedditPost[]>> {
    const tickerMentions = new Map<string, RedditPost[]>();

    for (const subreddit of this.targetSubreddits) {
      try {
        const posts = await this.fetchHotPosts(subreddit.name, 50);

        // Add weight and category to posts
        const weightedPosts = posts.map(post => ({
          ...post,
          weight: subreddit.weight,
          category: subreddit.category,
        }));

        // Extract tickers from titles and content
        for (const post of weightedPosts) {
          const tickers = this.extractTickers(post.title + ' ' + post.content);

          for (const ticker of tickers) {
            if (!tickerMentions.has(ticker)) {
              tickerMentions.set(ticker, []);
            }
            tickerMentions.get(ticker)!.push(post);
          }
        }
      } catch (error) {
        console.error(`Error scanning r/${subreddit.name}:`, error);
      }
    }

    return tickerMentions;
  }

  /**
   * Extract stock tickers from text using regex
   * Matches $TICKER or common ticker patterns
   */
  private extractTickers(text: string): string[] {
    const tickers: string[] = [];

    // Match $TICKER format
    const dollarMatches = text.match(/\$([A-Z]{1,5})\b/g);
    if (dollarMatches) {
      tickers.push(...dollarMatches.map(m => m.substring(1)));
    }

    // Match standalone 2-5 letter uppercase words (likely tickers)
    const wordMatches = text.match(/\b[A-Z]{2,5}\b/g);
    if (wordMatches) {
      // Filter out common words that aren't tickers
      const commonWords = ['I', 'A', 'CEO', 'IPO', 'ETF', 'USA', 'USD', 'SEC', 'FDA'];
      const likelyTickers = wordMatches.filter(word => !commonWords.includes(word));
      tickers.push(...likelyTickers);
    }

    // Return unique tickers
    return [...new Set(tickers)];
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
export const redditService = new RedditService();
