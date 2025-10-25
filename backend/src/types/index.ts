/**
 * Shared TypeScript types for the backend
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface StockAnalysisResponse {
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
      finnhub?: {
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
    createdAt: Date;
  }>;
}

export interface BatchAnalysisResponse {
  total: number;
  successful: number;
  results: Array<{
    ticker: string;
    price: number;
    change1d: number;
    sentiment: number;
    mentionCount: number;
    signal: 'green' | 'yellow' | 'red';
    phase: 'early' | 'mid' | 'late' | 'post' | 'none';
    confidence: number;
  } | null>;
}
