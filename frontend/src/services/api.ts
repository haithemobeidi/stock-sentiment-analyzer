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
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
    mentionCount: number;
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
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
   * Health check
   */
  async healthCheck() {
    const response = await axios.get('http://localhost:5000/health');
    return response.data;
  }
}

export const api = new ApiClient();
