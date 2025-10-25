import { Router } from 'express';
import { redditService } from '../services/reddit.service';
import { yahooService } from '../services/yahoo.service';
import { sentimentService } from '../services/sentiment.service';
import { pumpDetectionService } from '../services/pump-detection.service';
import { sentimentAggregator } from '../services/sentiment-aggregator.service';
import {
  classifyByMarketCap,
  isPennyStock,
  formatMarketCap,
  getRiskLevel,
  getSuitabilityForLowCapital,
} from '../utils/stock-classifier';

const router = Router();

/**
 * GET /api/stocks/:ticker/analyze
 * Complete analysis for a single stock
 */
router.get('/:ticker/analyze', async (req, res) => {
  try {
    const { ticker } = req.params;
    console.log(`📊 Analyzing ${ticker}...`);

    // Fetch data from all sources in parallel
    const [priceData, redditPosts, aggregatedSentiment] = await Promise.all([
      yahooService.fetchCompleteStockData(ticker.toUpperCase()),
      redditService.fetchStockMentions(ticker.toUpperCase(), 50),
      sentimentAggregator.aggregateSentiment(ticker.toUpperCase()),
    ]);

    if (!priceData) {
      return res.status(404).json({
        error: 'Stock not found',
        message: `Unable to fetch price data for ${ticker}`,
      });
    }

    // Analyze sentiment distribution from Reddit posts (for distribution metrics)
    const postTexts = redditPosts.map(post => `${post.title} ${post.content}`);
    const sentimentAnalysis = sentimentService.analyzeMultiple(postTexts);

    // Use aggregated multi-source sentiment for pump detection
    const sentimentForPump = {
      score: aggregatedSentiment.overallScore,
      label: aggregatedSentiment.overallLabel,
      confidence: aggregatedSentiment.confidence,
    };

    // Detect pump phase using aggregated sentiment
    const pumpDetection = pumpDetectionService.detectPumpPhase(
      sentimentForPump,
      priceData,
      aggregatedSentiment.totalMentions
    );

    // Classify stock by market cap
    const classification = classifyByMarketCap(priceData.marketCap);
    const pennyStock = isPennyStock(priceData.currentPrice, priceData.marketCap);
    const suitability = getSuitabilityForLowCapital(
      priceData.currentPrice,
      priceData.marketCap,
      priceData.volume
    );

    // Prepare response
    const analysis = {
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString(),

      // Price data
      price: {
        current: priceData.currentPrice,
        previousClose: priceData.previousClose,
        change1d: priceData.change1d,
        change1w: priceData.change1w,
        change2w: priceData.change2w,
        change1m: priceData.change1m,
        change3m: priceData.change3m,
        volume: priceData.volume,
        avgVolume: priceData.avgVolume,
        volumeRatio: priceData.avgVolume > 0 ? priceData.volume / priceData.avgVolume : 1,
      },

      // Stock classification
      classification: {
        marketCap: priceData.marketCap,
        marketCapFormatted: formatMarketCap(priceData.marketCap),
        category: classification,
        isPennyStock: pennyStock,
        riskLevel: getRiskLevel(classification),
        suitableForLowCapital: suitability.suitable,
        suitabilityReason: suitability.reason,
        capitalNeeded: suitability.capitalNeeded,
      },

      // Sentiment data (multi-source aggregated)
      sentiment: {
        score: aggregatedSentiment.overallScore,
        label: aggregatedSentiment.overallLabel,
        confidence: aggregatedSentiment.confidence,
        mentionCount: aggregatedSentiment.totalMentions,
        distribution: sentimentAnalysis.distribution,
        // Multi-source breakdown
        sources: aggregatedSentiment.sources,
        sourcesUsed: aggregatedSentiment.sourcesUsed,
      },

      // Pump detection
      pump: {
        phase: pumpDetection.phase,
        signal: pumpDetection.signal,
        confidence: pumpDetection.confidence,
        reasoning: pumpDetection.reasoning,
        summary: pumpDetectionService.generateSummary(pumpDetection),
      },

      // Top mentions
      topMentions: redditPosts.slice(0, 10).map(post => ({
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        upvotes: post.upvotes,
        comments: post.comments,
        url: post.url,
        sentiment: sentimentService.analyzeStockSentiment(post.title + ' ' + post.content),
        createdAt: post.createdAt,
      })),
    };

    console.log(`✅ Analysis complete for ${ticker}: ${pumpDetection.signal} signal (${pumpDetection.phase} pump)`);

    res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing stock:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/stocks/:ticker/price
 * Get current price data only
 */
router.get('/:ticker/price', async (req, res) => {
  try {
    const { ticker } = req.params;
    const priceData = await yahooService.fetchCompleteStockData(ticker.toUpperCase());

    if (!priceData) {
      return res.status(404).json({
        error: 'Stock not found',
        message: `Unable to fetch price data for ${ticker}`,
      });
    }

    res.json(priceData);
  } catch (error: any) {
    console.error('Error fetching price:', error);
    res.status(500).json({
      error: 'Price fetch failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/stocks/:ticker/sentiment
 * Get sentiment analysis only
 */
router.get('/:ticker/sentiment', async (req, res) => {
  try {
    const { ticker } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const redditPosts = await redditService.fetchStockMentions(ticker.toUpperCase(), limit);

    if (redditPosts.length === 0) {
      return res.json({
        ticker: ticker.toUpperCase(),
        mentionCount: 0,
        sentiment: {
          score: 0,
          label: 'neutral',
          confidence: 0,
        },
        distribution: { positive: 0, neutral: 0, negative: 0 },
        posts: [],
      });
    }

    // Weighted sentiment analysis
    const weightedSentiment = sentimentService.analyzeWeighted(
      redditPosts.map(post => ({
        text: `${post.title} ${post.content}`,
        weight: post.upvotes + 1,
      }))
    );

    // Get distribution
    const postTexts = redditPosts.map(post => `${post.title} ${post.content}`);
    const analysis = sentimentService.analyzeMultiple(postTexts);

    res.json({
      ticker: ticker.toUpperCase(),
      mentionCount: redditPosts.length,
      sentiment: weightedSentiment,
      distribution: analysis.distribution,
      posts: redditPosts.slice(0, 20).map(post => ({
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        upvotes: post.upvotes,
        url: post.url,
        sentiment: sentimentService.analyzeStockSentiment(post.title + ' ' + post.content),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching sentiment:', error);
    res.status(500).json({
      error: 'Sentiment fetch failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/stocks/batch-analyze
 * Analyze multiple stocks at once
 */
router.post('/batch-analyze', async (req, res) => {
  try {
    const { tickers } = req.body;

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Provide an array of tickers',
      });
    }

    console.log(`📊 Batch analyzing ${tickers.length} stocks...`);

    // Analyze each stock (could be optimized with better parallelization)
    const results = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const [priceData, redditPosts] = await Promise.all([
            yahooService.fetchStockPrice(ticker.toUpperCase()),
            redditService.fetchStockMentions(ticker.toUpperCase(), 25),
          ]);

          if (!priceData) return null;

          const postTexts = redditPosts.map(post => `${post.title} ${post.content}`);
          const weightedSentiment = sentimentService.analyzeWeighted(
            redditPosts.map(post => ({
              text: `${post.title} ${post.content}`,
              weight: post.upvotes + 1,
            }))
          );

          const pumpDetection = pumpDetectionService.detectPumpPhase(
            weightedSentiment,
            priceData,
            redditPosts.length
          );

          return {
            ticker: ticker.toUpperCase(),
            price: priceData.currentPrice,
            change1d: priceData.change1d,
            sentiment: weightedSentiment.score,
            mentionCount: redditPosts.length,
            signal: pumpDetection.signal,
            phase: pumpDetection.phase,
            confidence: pumpDetection.confidence,
          };
        } catch (error) {
          console.error(`Error analyzing ${ticker}:`, error);
          return null;
        }
      })
    );

    // Filter out failed stocks
    const successful = results.filter(Boolean);

    console.log(`✅ Batch analysis complete: ${successful.length}/${tickers.length} successful`);

    res.json({
      total: tickers.length,
      successful: successful.length,
      results: successful,
    });
  } catch (error: any) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({
      error: 'Batch analysis failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/stocks/trending
 * Get trending stocks from Reddit with weighted scoring
 */
router.get('/trending', async (req, res) => {
  try {
    console.log('🔍 Scanning Reddit for trending stocks...');

    const tickerMentions = await redditService.scanAllSubreddits();

    // Calculate weighted scores
    const trending = Array.from(tickerMentions.entries())
      .map(([ticker, posts]) => {
        // Calculate weighted score: sum of (upvotes * subreddit weight)
        const weightedScore = posts.reduce((sum, post) => {
          return sum + (post.upvotes + 1) * (post.weight || 1);
        }, 0);

        // Count penny stock mentions
        const pennyMentions = posts.filter(p => p.category === 'penny').length;

        return {
          ticker,
          mentionCount: posts.length,
          totalUpvotes: posts.reduce((sum, post) => sum + post.upvotes, 0),
          weightedScore,
          pennyMentions,
          isPennyFocused: pennyMentions > posts.length / 2, // More than 50% from penny subs
        };
      })
      .sort((a, b) => b.weightedScore - a.weightedScore) // Sort by weighted score
      .slice(0, 20);

    console.log(`✅ Found ${trending.length} trending stocks`);

    res.json({
      timestamp: new Date().toISOString(),
      trending,
    });
  } catch (error: any) {
    console.error('Error fetching trending:', error);
    res.status(500).json({
      error: 'Trending fetch failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/stocks/top-today
 * Get top 3 most talked about stocks today with full analysis
 */
router.get('/top-today', async (req, res) => {
  try {
    console.log('🔍 Finding top 3 most talked about stocks...');

    const tickerMentions = await redditService.scanAllSubreddits();

    // Get top 3 by weighted score
    const top3Tickers = Array.from(tickerMentions.entries())
      .map(([ticker, posts]) => {
        const weightedScore = posts.reduce((sum, post) => {
          return sum + (post.upvotes + 1) * (post.weight || 1);
        }, 0);

        return { ticker, posts, weightedScore };
      })
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 3);

    // Analyze each of the top 3
    const topStocksAnalysis = await Promise.all(
      top3Tickers.map(async ({ ticker, posts, weightedScore }) => {
        try {
          // Get price data
          const priceData = await yahooService.fetchCompleteStockData(ticker);
          if (!priceData) return null;

          // Analyze sentiment
          const weightedSentiment = sentimentService.analyzeWeighted(
            posts.map(post => ({
              text: `${post.title} ${post.content}`,
              weight: (post.upvotes + 1) * (post.weight || 1),
            }))
          );

          // Classify stock
          const classification = classifyByMarketCap(priceData.marketCap);
          const pennyStock = isPennyStock(priceData.currentPrice, priceData.marketCap);

          // Pump detection
          const pumpDetection = pumpDetectionService.detectPumpPhase(
            weightedSentiment,
            priceData,
            posts.length
          );

          return {
            ticker,
            price: priceData.currentPrice,
            change1d: priceData.change1d,
            sentiment: weightedSentiment.score,
            sentimentLabel: weightedSentiment.label,
            mentionCount: posts.length,
            weightedScore,
            signal: pumpDetection.signal,
            phase: pumpDetection.phase,
            isPennyStock: pennyStock,
            marketCapFormatted: formatMarketCap(priceData.marketCap),
            category: classification,
          };
        } catch (error) {
          console.error(`Error analyzing top stock ${ticker}:`, error);
          return null;
        }
      })
    );

    const successful = topStocksAnalysis.filter(Boolean);

    console.log(`✅ Top 3 analysis complete`);

    res.json({
      timestamp: new Date().toISOString(),
      topStocks: successful,
      message: 'Most talked about stocks on trading subreddits today',
    });
  } catch (error: any) {
    console.error('Error fetching top stocks:', error);
    res.status(500).json({
      error: 'Top stocks fetch failed',
      message: error.message,
    });
  }
});

export default router;
