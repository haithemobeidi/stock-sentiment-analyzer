import { Router } from 'express';
import { redditService } from '../services/reddit.service';
import { yahooService } from '../services/yahoo.service';
import { sentimentService } from '../services/sentiment.service';
import { pumpDetectionService } from '../services/pump-detection.service';

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
    const [priceData, redditPosts] = await Promise.all([
      yahooService.fetchCompleteStockData(ticker.toUpperCase()),
      redditService.fetchStockMentions(ticker.toUpperCase(), 50),
    ]);

    if (!priceData) {
      return res.status(404).json({
        error: 'Stock not found',
        message: `Unable to fetch price data for ${ticker}`,
      });
    }

    // Analyze sentiment from Reddit posts
    const postTexts = redditPosts.map(post => `${post.title} ${post.content}`);
    const sentimentAnalysis = sentimentService.analyzeMultiple(postTexts);

    // Weighted sentiment (by upvotes)
    const weightedSentiment = sentimentService.analyzeWeighted(
      redditPosts.map(post => ({
        text: `${post.title} ${post.content}`,
        weight: post.upvotes + 1,
      }))
    );

    // Detect pump phase
    const pumpDetection = pumpDetectionService.detectPumpPhase(
      weightedSentiment,
      priceData,
      redditPosts.length
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

      // Sentiment data
      sentiment: {
        score: weightedSentiment.score,
        label: weightedSentiment.label,
        confidence: weightedSentiment.confidence,
        mentionCount: redditPosts.length,
        distribution: sentimentAnalysis.distribution,
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
 * Get trending stocks from Reddit
 */
router.get('/trending', async (req, res) => {
  try {
    console.log('🔍 Scanning Reddit for trending stocks...');

    const tickerMentions = await redditService.scanAllSubreddits();

    // Sort by mention count
    const trending = Array.from(tickerMentions.entries())
      .map(([ticker, posts]) => ({
        ticker,
        mentionCount: posts.length,
        totalUpvotes: posts.reduce((sum, post) => sum + post.upvotes, 0),
      }))
      .sort((a, b) => b.mentionCount - a.mentionCount)
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

export default router;
