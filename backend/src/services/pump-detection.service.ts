import { SentimentResult } from './sentiment.service';
import { StockPrice } from './yahoo.service';

/**
 * Pump phase types
 */
export type PumpPhase = 'early' | 'mid' | 'late' | 'post' | 'none';

/**
 * Trading signal types
 */
export type Signal = 'green' | 'yellow' | 'red';

/**
 * Pump detection result
 */
export interface PumpDetectionResult {
  phase: PumpPhase;
  signal: Signal;
  confidence: number; // 0-1
  reasoning: string[];
  metrics: {
    sentimentScore: number;
    sentimentTrend: 'improving' | 'stable' | 'declining';
    mentionVolume: number;
    mentionTrend: 'rising' | 'stable' | 'declining';
    priceM omentum: number;
    volumeRatio: number; // current volume / avg volume
  };
}

/**
 * Pump Detection Service
 *
 * Analyzes sentiment + price data to identify pump phases:
 * - Early: Low mentions increasing + positive sentiment + price starting to move
 * - Mid: High mentions + strong sentiment + rapid price increase
 * - Late: Very high mentions + extreme sentiment + overextended price
 * - Post: Declining mentions + negative sentiment + price falling
 * - None: Normal trading, no pump detected
 */
export class PumpDetectionService {
  /**
   * Detect pump phase for a stock
   */
  detectPumpPhase(
    sentiment: SentimentResult,
    priceData: StockPrice,
    mentionCount: number,
    previousMentionCount?: number,
    previousSentiment?: SentimentResult
  ): PumpDetectionResult {
    const reasoning: string[] = [];

    // Calculate sentiment trend
    let sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (previousSentiment) {
      const sentimentChange = sentiment.score - previousSentiment.score;
      if (sentimentChange > 0.1) {
        sentimentTrend = 'improving';
        reasoning.push(`Sentiment improving (+${(sentimentChange * 100).toFixed(1)}%)`);
      } else if (sentimentChange < -0.1) {
        sentimentTrend = 'declining';
        reasoning.push(`Sentiment declining (${(sentimentChange * 100).toFixed(1)}%)`);
      }
    }

    // Calculate mention trend
    let mentionTrend: 'rising' | 'stable' | 'declining' = 'stable';
    if (previousMentionCount && previousMentionCount > 0) {
      const mentionChange = ((mentionCount - previousMentionCount) / previousMentionCount) * 100;
      if (mentionChange > 20) {
        mentionTrend = 'rising';
        reasoning.push(`Mentions surging (+${mentionChange.toFixed(0)}%)`);
      } else if (mentionChange < -20) {
        mentionTrend = 'declining';
        reasoning.push(`Mentions declining (${mentionChange.toFixed(0)}%)`);
      }
    }

    // Calculate price momentum (average of short-term movements)
    const priceMomentum = this.calculatePriceMomentum(priceData);
    reasoning.push(`Price momentum: ${priceMomentum > 0 ? '+' : ''}${priceMomentum.toFixed(2)}%`);

    // Calculate volume ratio
    const volumeRatio = priceData.avgVolume > 0 ? priceData.volume / priceData.avgVolume : 1;
    if (volumeRatio > 1.5) {
      reasoning.push(`Volume ${volumeRatio.toFixed(1)}x above average`);
    } else if (volumeRatio < 0.5) {
      reasoning.push(`Volume ${(volumeRatio * 100).toFixed(0)}% of average`);
    }

    const metrics = {
      sentimentScore: sentiment.score,
      sentimentTrend,
      mentionVolume: mentionCount,
      mentionTrend,
      priceMomentum,
      volumeRatio,
    };

    // Determine pump phase based on combined signals
    const phase = this.classifyPumpPhase(metrics, reasoning);
    const signal = this.determineSignal(phase, metrics);
    const confidence = this.calculateConfidence(metrics);

    return {
      phase,
      signal,
      confidence,
      reasoning,
      metrics,
    };
  }

  /**
   * Calculate overall price momentum from various timeframes
   */
  private calculatePriceMomentum(priceData: StockPrice): number {
    const changes = [
      priceData.change1d,
      priceData.change1w,
      priceData.change2w,
      priceData.change1m,
    ].filter((c): c is number => c !== undefined && c !== null);

    if (changes.length === 0) return 0;

    // Weighted average (more weight on recent movements)
    const weights = [0.4, 0.3, 0.2, 0.1]; // 1d, 1w, 2w, 1m
    let weightedSum = 0;
    let weightTotal = 0;

    for (let i = 0; i < changes.length; i++) {
      weightedSum += changes[i] * (weights[i] || 0.1);
      weightTotal += weights[i] || 0.1;
    }

    return weightedSum / weightTotal;
  }

  /**
   * Classify pump phase based on metrics
   */
  private classifyPumpPhase(
    metrics: PumpDetectionResult['metrics'],
    reasoning: string[]
  ): PumpPhase {
    const { sentimentScore, sentimentTrend, mentionTrend, priceMomentum, volumeRatio } = metrics;

    // Early pump: Rising mentions, improving sentiment, price starting to move
    if (
      mentionTrend === 'rising' &&
      sentimentScore > 0.3 &&
      sentimentTrend === 'improving' &&
      priceMomentum > 2 &&
      priceMomentum < 15 &&
      volumeRatio > 1.2
    ) {
      reasoning.push('🟢 Early pump detected - potential entry point');
      return 'early';
    }

    // Mid pump: High mentions, strong sentiment, rapid price increase
    if (
      sentimentScore > 0.5 &&
      priceMomentum > 10 &&
      priceMomentum < 30 &&
      volumeRatio > 1.5
    ) {
      reasoning.push('🟡 Mid pump detected - momentum building');
      return 'mid';
    }

    // Late pump: Extreme mentions/sentiment, overextended price
    if (
      sentimentScore > 0.7 &&
      priceMomentum > 25 &&
      (mentionTrend === 'stable' || mentionTrend === 'declining')
    ) {
      reasoning.push('🔴 Late pump detected - high risk, likely overextended');
      return 'late';
    }

    // Post pump: Declining mentions, negative sentiment, price falling
    if (
      mentionTrend === 'declining' &&
      sentimentTrend === 'declining' &&
      priceMomentum < -5 &&
      volumeRatio < 0.8
    ) {
      reasoning.push('🔴 Post pump detected - avoid or exit');
      return 'post';
    }

    // No pump: Normal trading
    reasoning.push('No significant pump activity detected');
    return 'none';
  }

  /**
   * Determine trading signal (green/yellow/red)
   */
  private determineSignal(phase: PumpPhase, metrics: PumpDetectionResult['metrics']): Signal {
    // Green (Buy): Early pump or strong fundamentals
    if (phase === 'early') {
      return 'green';
    }

    if (
      phase === 'none' &&
      metrics.sentimentScore > 0.4 &&
      metrics.priceMomentum > 0 &&
      metrics.priceMomentum < 10
    ) {
      return 'green'; // Positive sentiment + moderate momentum = potential
    }

    // Red (Avoid): Late pump, post pump, or negative signals
    if (phase === 'late' || phase === 'post') {
      return 'red';
    }

    if (metrics.sentimentScore < -0.3 || metrics.priceMomentum < -10) {
      return 'red'; // Negative sentiment or falling price
    }

    // Yellow (Watch): Mid pump or uncertain signals
    return 'yellow';
  }

  /**
   * Calculate confidence in the signal (0-1)
   */
  private calculateConfidence(metrics: PumpDetectionResult['metrics']): number {
    let confidence = 0;

    // Sentiment confidence
    const sentimentStrength = Math.abs(metrics.sentimentScore);
    confidence += sentimentStrength * 0.3; // 30% weight

    // Volume confirmation
    const volumeConfidence = Math.min(1, Math.abs(metrics.volumeRatio - 1));
    confidence += volumeConfidence * 0.25; // 25% weight

    // Price momentum confidence
    const momentumStrength = Math.min(1, Math.abs(metrics.priceMomentum) / 20);
    confidence += momentumStrength * 0.25; // 25% weight

    // Trend alignment confidence
    const trendsAligned =
      (metrics.sentimentTrend === 'improving' && metrics.mentionTrend === 'rising') ||
      (metrics.sentimentTrend === 'declining' && metrics.mentionTrend === 'declining');

    confidence += trendsAligned ? 0.2 : 0.1; // 20% weight if aligned

    return Math.min(1, confidence);
  }

  /**
   * Generate human-readable summary of pump detection
   */
  generateSummary(result: PumpDetectionResult): string {
    const { phase, signal, confidence, metrics } = result;

    const confidenceText = confidence > 0.7 ? 'High' : confidence > 0.4 ? 'Medium' : 'Low';
    const phaseText = phase === 'none' ? 'No pump' : `${phase} pump`;
    const signalEmoji = signal === 'green' ? '🟢' : signal === 'yellow' ? '🟡' : '🔴';

    let action = '';
    if (signal === 'green') {
      action = 'Consider buying';
    } else if (signal === 'yellow') {
      action = 'Monitor closely';
    } else {
      action = 'Avoid or exit';
    }

    return `${signalEmoji} ${phaseText} | ${action} | Confidence: ${confidenceText} (${(confidence * 100).toFixed(0)}%)`;
  }
}

// Export singleton instance
export const pumpDetectionService = new PumpDetectionService();
