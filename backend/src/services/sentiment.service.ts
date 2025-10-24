import * as vader from 'vader-sentiment';

/**
 * Sentiment analysis result from VADER
 */
export interface SentimentResult {
  score: number; // Compound score (-1 to 1)
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1 confidence level
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

/**
 * VADER Sentiment Analysis Service
 *
 * VADER (Valence Aware Dictionary and sEntiment Reasoner) is specifically
 * designed for social media text and handles:
 * - Emojis and emoticons 🚀 💎
 * - Capitalization (MOON vs moon)
 * - Punctuation (!!!)
 * - Slang and abbreviations (HODL, YOLO, etc.)
 */
export class SentimentService {
  /**
   * Analyze sentiment of a single text
   */
  analyzeSentiment(text: string): SentimentResult {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        label: 'neutral',
        confidence: 0,
        breakdown: { positive: 0, neutral: 1, negative: 0 },
      };
    }

    // Run VADER analysis
    const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);

    // Determine label based on compound score
    let label: 'positive' | 'neutral' | 'negative';
    if (result.compound >= 0.05) {
      label = 'positive';
    } else if (result.compound <= -0.05) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    // Calculate confidence (how strong the sentiment is)
    const confidence = Math.abs(result.compound);

    return {
      score: result.compound,
      label,
      confidence,
      breakdown: {
        positive: result.pos,
        neutral: result.neu,
        negative: result.neg,
      },
    };
  }

  /**
   * Analyze sentiment for multiple texts and return aggregated result
   */
  analyzeMultiple(texts: string[]): {
    averageScore: number;
    sentiment: SentimentResult;
    individual: SentimentResult[];
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  } {
    if (texts.length === 0) {
      return {
        averageScore: 0,
        sentiment: {
          score: 0,
          label: 'neutral',
          confidence: 0,
          breakdown: { positive: 0, neutral: 1, negative: 0 },
        },
        individual: [],
        distribution: { positive: 0, neutral: 0, negative: 0 },
      };
    }

    // Analyze each text
    const individual = texts.map(text => this.analyzeSentiment(text));

    // Calculate average score
    const averageScore = individual.reduce((sum, result) => sum + result.score, 0) / individual.length;

    // Count distribution
    const distribution = {
      positive: individual.filter(r => r.label === 'positive').length,
      neutral: individual.filter(r => r.label === 'neutral').length,
      negative: individual.filter(r => r.label === 'negative').length,
    };

    // Create aggregated sentiment
    const sentiment = this.analyzeSentiment(texts.join(' '));

    return {
      averageScore,
      sentiment,
      individual,
      distribution,
    };
  }

  /**
   * Weighted sentiment analysis (e.g., weight by upvotes or engagement)
   */
  analyzeWeighted(items: Array<{ text: string; weight: number }>): SentimentResult {
    if (items.length === 0) {
      return {
        score: 0,
        label: 'neutral',
        confidence: 0,
        breakdown: { positive: 0, neutral: 1, negative: 0 },
      };
    }

    let totalWeight = 0;
    let weightedScore = 0;
    let weightedPositive = 0;
    let weightedNeutral = 0;
    let weightedNegative = 0;

    for (const item of items) {
      const sentiment = this.analyzeSentiment(item.text);
      const weight = Math.max(1, item.weight); // Minimum weight of 1

      totalWeight += weight;
      weightedScore += sentiment.score * weight;
      weightedPositive += sentiment.breakdown.positive * weight;
      weightedNeutral += sentiment.breakdown.neutral * weight;
      weightedNegative += sentiment.breakdown.negative * weight;
    }

    const score = weightedScore / totalWeight;

    let label: 'positive' | 'neutral' | 'negative';
    if (score >= 0.05) {
      label = 'positive';
    } else if (score <= -0.05) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    return {
      score,
      label,
      confidence: Math.abs(score),
      breakdown: {
        positive: weightedPositive / totalWeight,
        neutral: weightedNeutral / totalWeight,
        negative: weightedNegative / totalWeight,
      },
    };
  }

  /**
   * Detect financial keywords and adjust sentiment accordingly
   * This enhances VADER for stock-specific language
   */
  analyzeStockSentiment(text: string): SentimentResult {
    const baseSentiment = this.analyzeSentiment(text);

    // Stock-specific bullish keywords
    const bullishKeywords = [
      'moon', 'rocket', 'buy', 'calls', 'bullish', 'breakout', 'squeeze',
      'tendies', 'diamond hands', 'hodl', 'buying the dip', 'undervalued',
      'breakout', 'rally', 'pump', 'gains', 'lambo'
    ];

    // Stock-specific bearish keywords
    const bearishKeywords = [
      'puts', 'bearish', 'crash', 'dump', 'overvalued', 'bubble',
      'paper hands', 'bag holder', 'rekt', 'falling knife', 'bear trap'
    ];

    const lowerText = text.toLowerCase();

    let adjustment = 0;
    for (const keyword of bullishKeywords) {
      if (lowerText.includes(keyword)) adjustment += 0.1;
    }
    for (const keyword of bearishKeywords) {
      if (lowerText.includes(keyword)) adjustment -= 0.1;
    }

    // Apply adjustment (capped at -1 to 1)
    const adjustedScore = Math.max(-1, Math.min(1, baseSentiment.score + adjustment));

    let label: 'positive' | 'neutral' | 'negative';
    if (adjustedScore >= 0.05) {
      label = 'positive';
    } else if (adjustedScore <= -0.05) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    return {
      score: adjustedScore,
      label,
      confidence: Math.abs(adjustedScore),
      breakdown: baseSentiment.breakdown,
    };
  }
}

// Export singleton instance
export const sentimentService = new SentimentService();
