import { finnhubService } from './finnhub.service';
import { alphaVantageService } from './alpha-vantage.service';
import { redditService } from './reddit.service';
import { sentimentService } from './sentiment.service';

/**
 * Normalized sentiment data from any source
 */
export interface SentimentDataPoint {
  source: 'finnhub' | 'alpha_vantage' | 'reddit';
  score: number; // -1 (bearish) to 1 (bullish)
  confidence: number; // 0 to 1
  mentionCount?: number;
  timestamp: Date;
}

/**
 * Aggregated multi-source sentiment result
 */
export interface AggregatedSentiment {
  // Overall metrics
  overallScore: number; // -1 to 1
  overallLabel: 'Very Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Very Bearish';
  confidence: number; // 0 to 1

  // Source breakdown
  sources: {
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

  // Metadata
  totalMentions: number;
  sourcesUsed: string[];
  calculatedAt: Date;
}

/**
 * Sentiment Aggregator Service
 *
 * Combines sentiment from multiple sources with intelligent weighting:
 * - Finnhub: 35% (pre-aggregated Reddit + Twitter)
 * - Alpha Vantage: 30% (professional news)
 * - Reddit Direct: 35% (your weighted subreddit scoring)
 */
export class SentimentAggregatorService {
  // Source weights (should total to 1.0)
  private readonly SOURCE_WEIGHTS = {
    finnhub: 0.35,        // Aggregated social media
    alphaVantage: 0.30,   // News sentiment
    reddit: 0.35,         // Direct Reddit with your weighting
  };

  /**
   * Aggregate sentiment from all available sources
   */
  async aggregateSentiment(ticker: string): Promise<AggregatedSentiment> {
    console.log(`\n📊 Aggregating multi-source sentiment for ${ticker}...`);

    const dataPoints: SentimentDataPoint[] = [];
    const sources: AggregatedSentiment['sources'] = {};
    const sourcesUsed: string[] = [];

    // Fetch from all sources in parallel
    const [finnhubData, alphaVantageData, redditData] = await Promise.all([
      this.fetchFinnhubSentiment(ticker),
      this.fetchAlphaVantageSentiment(ticker),
      this.fetchRedditSentiment(ticker),
    ]);

    // Process Finnhub data
    if (finnhubData) {
      dataPoints.push(finnhubData);
      sources.finnhub = {
        score: finnhubData.score,
        mentions: finnhubData.mentionCount || 0,
        confidence: finnhubData.confidence,
        weight: this.SOURCE_WEIGHTS.finnhub,
      };
      sourcesUsed.push('Finnhub (Reddit + Twitter)');
    }

    // Process Alpha Vantage data
    if (alphaVantageData) {
      dataPoints.push(alphaVantageData);
      sources.alphaVantage = {
        score: alphaVantageData.score,
        articles: alphaVantageData.mentionCount || 0,
        confidence: alphaVantageData.confidence,
        weight: this.SOURCE_WEIGHTS.alphaVantage,
      };
      sourcesUsed.push('Alpha Vantage (News)');
    }

    // Process Reddit data
    if (redditData) {
      dataPoints.push(redditData);
      sources.reddit = {
        score: redditData.score,
        posts: redditData.mentionCount || 0,
        confidence: redditData.confidence,
        weight: this.SOURCE_WEIGHTS.reddit,
      };
      sourcesUsed.push('Reddit (Weighted)');
    }

    // Calculate weighted average
    const aggregated = this.calculateWeightedAverage(dataPoints);

    // Calculate total mentions across all sources
    const totalMentions = (
      (sources.finnhub?.mentions || 0) +
      (sources.alphaVantage?.articles || 0) +
      (sources.reddit?.posts || 0)
    );

    return {
      overallScore: aggregated.score,
      overallLabel: this.labelSentiment(aggregated.score),
      confidence: aggregated.confidence,
      sources,
      totalMentions,
      sourcesUsed,
      calculatedAt: new Date(),
    };
  }

  /**
   * Fetch and normalize Finnhub sentiment
   */
  private async fetchFinnhubSentiment(ticker: string): Promise<SentimentDataPoint | null> {
    try {
      const data = await finnhubService.getAverageSentiment(ticker, 7); // Last 7 days

      if (!data) return null;

      return {
        source: 'finnhub',
        score: data.averageScore, // Already -1 to 1
        confidence: data.confidence,
        mentionCount: data.totalMentions,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching Finnhub sentiment:', error);
      return null;
    }
  }

  /**
   * Fetch and normalize Alpha Vantage sentiment
   */
  private async fetchAlphaVantageSentiment(ticker: string): Promise<SentimentDataPoint | null> {
    try {
      const data = await alphaVantageService.getAggregatedSentiment(ticker, 50);

      if (!data) return null;

      return {
        source: 'alpha_vantage',
        score: data.averageSentiment, // Already -1 to 1
        confidence: data.confidence,
        mentionCount: data.relevantArticleCount,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching Alpha Vantage sentiment:', error);
      return null;
    }
  }

  /**
   * Fetch and normalize Reddit sentiment
   */
  private async fetchRedditSentiment(ticker: string): Promise<SentimentDataPoint | null> {
    try {
      const posts = await redditService.fetchStockMentions(ticker, 50);

      if (!posts || posts.length === 0) return null;

      // Use your existing sentiment analysis with weighted scoring
      const weightedTexts = posts.map(post => ({
        text: `${post.title} ${post.content}`,
        weight: (post.upvotes + 1) * (post.weight || 1),
      }));

      const sentiment = sentimentService.analyzeWeighted(weightedTexts);

      // Convert VADER compound score (-1 to 1) - already in correct range
      const score = sentiment.compound;

      // Calculate confidence based on volume and consistency
      const confidence = this.calculateRedditConfidence(posts, sentiment);

      return {
        source: 'reddit',
        score,
        confidence,
        mentionCount: posts.length,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error fetching Reddit sentiment:', error);
      return null;
    }
  }

  /**
   * Calculate Reddit sentiment confidence
   */
  private calculateRedditConfidence(posts: any[], sentiment: any): number {
    // Factor 1: Volume (more posts = higher confidence)
    const volumeFactor = Math.min(posts.length / 50, 1.0);

    // Factor 2: Consistency (check if individual sentiments agree)
    const individualScores = posts.map(post => {
      const text = `${post.title} ${post.content}`;
      const result = sentimentService.analyzeSentiment(text);
      return result.compound;
    });

    const avgScore = sentiment.compound;
    const variance = individualScores.reduce((sum, score) => {
      return sum + Math.pow(score - avgScore, 2);
    }, 0) / individualScores.length;

    const consistency = 1 - Math.min(variance, 1.0); // Lower variance = higher consistency

    // Combine factors
    return (volumeFactor * 0.4) + (consistency * 0.6);
  }

  /**
   * Calculate weighted average of sentiment scores
   */
  private calculateWeightedAverage(dataPoints: SentimentDataPoint[]): {
    score: number;
    confidence: number;
  } {
    if (dataPoints.length === 0) {
      return { score: 0, confidence: 0 };
    }

    let weightedScoreSum = 0;
    let totalWeight = 0;
    let confidenceSum = 0;

    for (const dataPoint of dataPoints) {
      // Get source weight
      const sourceWeight = this.SOURCE_WEIGHTS[dataPoint.source];

      // Combine source weight with data confidence
      const combinedWeight = sourceWeight * dataPoint.confidence;

      weightedScoreSum += dataPoint.score * combinedWeight;
      totalWeight += combinedWeight;
      confidenceSum += dataPoint.confidence;
    }

    const score = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;

    // Overall confidence is average of individual confidences
    // But also factor in source diversity (more sources = higher confidence)
    const avgConfidence = confidenceSum / dataPoints.length;
    const diversityFactor = Math.min(dataPoints.length / 3, 1.0); // 3 sources = max diversity
    const confidence = (avgConfidence * 0.7) + (diversityFactor * 0.3);

    return { score, confidence };
  }

  /**
   * Convert numeric sentiment score to label
   */
  private labelSentiment(score: number): AggregatedSentiment['overallLabel'] {
    if (score > 0.5) return 'Very Bullish';
    if (score > 0.15) return 'Bullish';
    if (score >= -0.15) return 'Neutral';
    if (score >= -0.5) return 'Bearish';
    return 'Very Bearish';
  }
}

// Export singleton instance
export const sentimentAggregator = new SentimentAggregatorService();
