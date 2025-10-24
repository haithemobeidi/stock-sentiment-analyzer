import axios from 'axios';
import NodeCache from 'node-cache';

/**
 * Stock price data structure
 */
export interface StockPrice {
  ticker: string;
  currentPrice: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap?: number;
  change1d: number; // % change
  change1w?: number;
  change2w?: number;
  change1m?: number;
  change3m?: number;
  timestamp: Date;
}

/**
 * Historical price point
 */
export interface PricePoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Yahoo Finance API Service
 *
 * Uses Yahoo Finance's unofficial API to fetch stock prices
 * No API key required, but rate limits apply
 *
 * Alternative endpoints:
 * - query1.finance.yahoo.com (v7/v8 API)
 * - finance.yahoo.com (scraping fallback)
 */
export class YahooFinanceService {
  private cache: NodeCache;
  private readonly baseUrl = 'https://query1.finance.yahoo.com';

  constructor() {
    // Cache price data for 15 minutes (900 seconds)
    this.cache = new NodeCache({ stdTTL: 900 });
  }

  /**
   * Fetch current stock price and basic info
   */
  async fetchStockPrice(ticker: string): Promise<StockPrice | null> {
    const cacheKey = `price:${ticker}`;
    const cached = this.cache.get<StockPrice>(cacheKey);

    if (cached) {
      console.log(`✅ Yahoo Finance cache hit for ${ticker}`);
      return cached;
    }

    console.log(`🔍 Fetching price data for ${ticker}...`);

    try {
      const url = `${this.baseUrl}/v8/finance/chart/${ticker}`;

      const response = await axios.get(url, {
        params: {
          interval: '1d',
          range: '5d', // Get last 5 days for trend calculation
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        console.error(`❌ No data returned for ${ticker}`);
        return null;
      }

      const meta = result.meta;
      const quotes = result.indicators?.quote?.[0];

      if (!meta || !quotes) {
        console.error(`❌ Invalid data structure for ${ticker}`);
        return null;
      }

      const currentPrice = meta.regularMarketPrice || quotes.close[quotes.close.length - 1];
      const previousClose = meta.previousClose || quotes.close[quotes.close.length - 2];

      const priceData: StockPrice = {
        ticker: ticker.toUpperCase(),
        currentPrice,
        previousClose,
        volume: quotes.volume[quotes.volume.length - 1] || 0,
        avgVolume: meta.averageDailyVolume10Day || 0,
        marketCap: meta.marketCap,
        change1d: ((currentPrice - previousClose) / previousClose) * 100,
        timestamp: new Date(),
      };

      this.cache.set(cacheKey, priceData);
      console.log(`✅ Fetched ${ticker}: $${currentPrice.toFixed(2)} (${priceData.change1d.toFixed(2)}%)`);

      return priceData;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.error(`❌ Ticker ${ticker} not found`);
      } else if (error.response?.status === 429) {
        console.error(`⚠️ Rate limited by Yahoo Finance`);
      } else {
        console.error(`Error fetching ${ticker}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Fetch historical price data for calculating longer-term movements
   */
  async fetchHistoricalPrices(ticker: string, period: '1w' | '2w' | '1m' | '3m' | '1y' = '3m'): Promise<PricePoint[]> {
    const cacheKey = `history:${ticker}:${period}`;
    const cached = this.cache.get<PricePoint[]>(cacheKey);

    if (cached) {
      console.log(`✅ Historical data cache hit for ${ticker} (${period})`);
      return cached;
    }

    console.log(`🔍 Fetching historical data for ${ticker} (${period})...`);

    try {
      // Map periods to Yahoo Finance range parameter
      const rangeMap = {
        '1w': '7d',
        '2w': '14d',
        '1m': '1mo',
        '3m': '3mo',
        '1y': '1y',
      };

      const url = `${this.baseUrl}/v8/finance/chart/${ticker}`;

      const response = await axios.get(url, {
        params: {
          interval: '1d',
          range: rangeMap[period],
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        console.error(`❌ No historical data for ${ticker}`);
        return [];
      }

      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0];

      if (!quotes) {
        console.error(`❌ Invalid historical data for ${ticker}`);
        return [];
      }

      const pricePoints: PricePoint[] = timestamps.map((ts: number, i: number) => ({
        date: new Date(ts * 1000),
        open: quotes.open[i] || 0,
        high: quotes.high[i] || 0,
        low: quotes.low[i] || 0,
        close: quotes.close[i] || 0,
        volume: quotes.volume[i] || 0,
      }));

      this.cache.set(cacheKey, pricePoints);
      console.log(`✅ Fetched ${pricePoints.length} historical data points for ${ticker}`);

      return pricePoints;
    } catch (error: any) {
      console.error(`Error fetching historical data for ${ticker}:`, error.message);
      return [];
    }
  }

  /**
   * Calculate price movements over various timeframes
   */
  async calculateMovements(ticker: string): Promise<Partial<StockPrice>> {
    try {
      const [currentData, historical3m] = await Promise.all([
        this.fetchStockPrice(ticker),
        this.fetchHistoricalPrices(ticker, '3m'),
      ]);

      if (!currentData || historical3m.length === 0) {
        return {};
      }

      const currentPrice = currentData.currentPrice;

      // Calculate movements
      const now = new Date();
      const getClosestPrice = (daysAgo: number): number | null => {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() - daysAgo);

        const closest = historical3m.reduce((prev, curr) => {
          return Math.abs(curr.date.getTime() - targetDate.getTime()) <
            Math.abs(prev.date.getTime() - targetDate.getTime())
            ? curr
            : prev;
        });

        return closest?.close || null;
      };

      const price1w = getClosestPrice(7);
      const price2w = getClosestPrice(14);
      const price1m = getClosestPrice(30);
      const price3m = getClosestPrice(90);

      return {
        change1w: price1w ? ((currentPrice - price1w) / price1w) * 100 : undefined,
        change2w: price2w ? ((currentPrice - price2w) / price2w) * 100 : undefined,
        change1m: price1m ? ((currentPrice - price1m) / price1m) * 100 : undefined,
        change3m: price3m ? ((currentPrice - price3m) / price3m) * 100 : undefined,
      };
    } catch (error) {
      console.error(`Error calculating movements for ${ticker}:`, error);
      return {};
    }
  }

  /**
   * Fetch complete stock data with all timeframe movements
   */
  async fetchCompleteStockData(ticker: string): Promise<StockPrice | null> {
    const [basicData, movements] = await Promise.all([
      this.fetchStockPrice(ticker),
      this.calculateMovements(ticker),
    ]);

    if (!basicData) return null;

    return {
      ...basicData,
      ...movements,
    };
  }

  /**
   * Batch fetch multiple stocks
   */
  async fetchMultipleStocks(tickers: string[]): Promise<Map<string, StockPrice>> {
    console.log(`🔍 Fetching ${tickers.length} stocks...`);

    const results = new Map<string, StockPrice>();

    // Fetch in parallel but with rate limiting consideration
    const promises = tickers.map(async (ticker) => {
      const data = await this.fetchStockPrice(ticker);
      if (data) {
        results.set(ticker, data);
      }
    });

    await Promise.all(promises);

    console.log(`✅ Successfully fetched ${results.size}/${tickers.length} stocks`);

    return results;
  }

  /**
   * Clear cache for specific ticker or all
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
export const yahooService = new YahooFinanceService();
