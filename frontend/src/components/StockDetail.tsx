import React from 'react';
import { X, ExternalLink, TrendingUp, MessageSquare } from 'lucide-react';
import { StockAnalysis } from '../services/api';
import { format } from 'date-fns';

interface StockDetailProps {
  analysis: StockAnalysis;
  onClose: () => void;
}

export const StockDetail: React.FC<StockDetailProps> = ({ analysis, onClose }) => {
  const { ticker, price, sentiment, pump, topMentions } = analysis;

  const signalColors = {
    green: 'bg-green-500/20 border-green-500',
    yellow: 'bg-yellow-500/20 border-yellow-500',
    red: 'bg-red-500/20 border-red-500',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">{ticker}</h2>
            <p className="text-gray-400">Detailed Analysis</p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pump Signal Summary */}
          <div className={`${signalColors[pump.signal]} border-2 rounded-lg p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Pump Detection</h3>
              <span className="text-4xl">
                {pump.signal === 'green' ? '🟢' : pump.signal === 'yellow' ? '🟡' : '🔴'}
              </span>
            </div>
            <p className="text-lg mb-4">{pump.summary}</p>
            <div className="space-y-2">
              {pump.reasoning.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span>•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Information */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Price Movements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Current Price</div>
                <div className="text-2xl font-bold">${price.current.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Previous Close</div>
                <div className="text-lg">${price.previousClose.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">1 Day Change</div>
                <div className={`text-lg font-semibold ${price.change1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {price.change1d >= 0 ? '+' : ''}{price.change1d.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">1 Week Change</div>
                <div className={`text-lg font-semibold ${(price.change1w || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {price.change1w ? `${price.change1w >= 0 ? '+' : ''}${price.change1w.toFixed(2)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">1 Month Change</div>
                <div className={`text-lg font-semibold ${(price.change1m || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {price.change1m ? `${price.change1m >= 0 ? '+' : ''}${price.change1m.toFixed(2)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">3 Month Change</div>
                <div className={`text-lg font-semibold ${(price.change3m || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {price.change3m ? `${price.change3m >= 0 ? '+' : ''}${price.change3m.toFixed(2)}%` : 'N/A'}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-600 grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm">Volume</div>
                <div className="text-lg">{price.volume.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Volume Ratio</div>
                <div className="text-lg">{price.volumeRatio.toFixed(2)}x average</div>
              </div>
            </div>
          </div>

          {/* Stock Classification - Low Capital Suitability */}
          {analysis.classification && (
            <div className="bg-gray-700 rounded-lg p-6 border-2 border-purple-500/30">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                💰 Low Capital Suitability
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-gray-400 text-sm">Market Cap</div>
                  <div className="text-lg font-semibold">{analysis.classification.marketCapFormatted}</div>
                  <div className="text-xs text-gray-500">{analysis.classification.category} cap</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Penny Stock</div>
                  <div className="text-lg font-semibold">
                    {analysis.classification.isPennyStock ? (
                      <span className="text-purple-400">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Risk Level</div>
                  <div className="text-sm">{analysis.classification.riskLevel}</div>
                </div>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`text-2xl ${analysis.classification.suitableForLowCapital ? 'text-green-400' : 'text-yellow-400'}`}>
                    {analysis.classification.suitableForLowCapital ? '✅' : '⚠️'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">
                      {analysis.classification.suitableForLowCapital ? 'Good for Low Capital' : 'Caution Advised'}
                    </div>
                    <div className="text-sm text-gray-300">{analysis.classification.suitabilityReason}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  <span className="font-semibold">Capital Needed:</span> {analysis.classification.capitalNeeded}
                </div>
              </div>
            </div>
          )}

          {/* Sentiment Information */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Sentiment Analysis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-gray-400 text-sm">Overall Score</div>
                <div className="text-2xl font-bold">{(sentiment.score * 100).toFixed(0)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Sentiment</div>
                <div className={`text-lg font-semibold ${
                  sentiment.label === 'Very Bullish' || sentiment.label === 'Bullish' ? 'text-green-400' :
                  sentiment.label === 'Very Bearish' || sentiment.label === 'Bearish' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {sentiment.label}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Mentions</div>
                <div className="text-2xl font-bold">{sentiment.mentionCount}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm">Confidence</div>
                <div className="text-lg">{(sentiment.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Positive</span>
                <span className="text-gray-400">{sentiment.distribution.positive} posts</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(sentiment.distribution.positive / sentiment.mentionCount) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Neutral</span>
                <span className="text-gray-400">{sentiment.distribution.neutral} posts</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-gray-500 h-2 rounded-full"
                  style={{ width: `${(sentiment.distribution.neutral / sentiment.mentionCount) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Negative</span>
                <span className="text-gray-400">{sentiment.distribution.negative} posts</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(sentiment.distribution.negative / sentiment.mentionCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Multi-Source Sentiment Breakdown */}
            {sentiment.sources && sentiment.sourcesUsed && sentiment.sourcesUsed.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-600">
                <h4 className="text-sm font-semibold mb-3 text-gray-300">
                  Data Sources ({sentiment.sourcesUsed.length})
                </h4>
                <div className="space-y-3">
                  {sentiment.sources.twitter && (
                    <div className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium">Twitter/X Sentiment</div>
                        <div className="text-xs text-gray-400">Weight: {(sentiment.sources.twitter.weight * 100).toFixed(0)}%</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Score</div>
                          <div className="font-semibold">{(sentiment.sources.twitter.score * 100).toFixed(0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Mentions</div>
                          <div className="font-semibold">{sentiment.sources.twitter.mentions}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Confidence</div>
                          <div className="font-semibold">{(sentiment.sources.twitter.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {sentiment.sources.alphaVantage && (
                    <div className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium">Alpha Vantage (News)</div>
                        <div className="text-xs text-gray-400">Weight: {(sentiment.sources.alphaVantage.weight * 100).toFixed(0)}%</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Score</div>
                          <div className="font-semibold">{(sentiment.sources.alphaVantage.score * 100).toFixed(0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Articles</div>
                          <div className="font-semibold">{sentiment.sources.alphaVantage.articles}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Confidence</div>
                          <div className="font-semibold">{(sentiment.sources.alphaVantage.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {sentiment.sources.reddit && (
                    <div className="bg-gray-800 rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium">Reddit (Weighted)</div>
                        <div className="text-xs text-gray-400">Weight: {(sentiment.sources.reddit.weight * 100).toFixed(0)}%</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Score</div>
                          <div className="font-semibold">{(sentiment.sources.reddit.score * 100).toFixed(0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Posts</div>
                          <div className="font-semibold">{sentiment.sources.reddit.posts}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Confidence</div>
                          <div className="font-semibold">{(sentiment.sources.reddit.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pump Detection Breakdown - Show Your Work */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">📊 Detection Metrics (Show Your Work)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded p-4">
                <div className="text-gray-400 text-sm mb-1">Sentiment Score</div>
                <div className="text-2xl font-bold">{(sentiment.score * 100).toFixed(0)}</div>
                <div className="text-xs text-gray-500">Range: -100 to +100</div>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <div className="text-gray-400 text-sm mb-1">Mention Count</div>
                <div className="text-2xl font-bold">{sentiment.mentionCount}</div>
                <div className="text-xs text-gray-500">Reddit posts</div>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <div className="text-gray-400 text-sm mb-1">Price Momentum</div>
                <div className={`text-2xl font-bold ${price.change1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {price.change1d >= 0 ? '+' : ''}{price.change1d.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-500">1-day change</div>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <div className="text-gray-400 text-sm mb-1">Volume Ratio</div>
                <div className={`text-2xl font-bold ${price.volumeRatio > 1.5 ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {price.volumeRatio.toFixed(1)}x
                </div>
                <div className="text-xs text-gray-500">vs avg volume</div>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <div className="text-gray-400 text-sm mb-1">Signal Confidence</div>
                <div className="text-2xl font-bold">{(pump.confidence * 100).toFixed(0)}%</div>
                <div className="text-xs text-gray-500">Algorithm certainty</div>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <div className="text-gray-400 text-sm mb-1">Pump Phase</div>
                <div className="text-2xl font-bold capitalize">{pump.phase}</div>
                <div className="text-xs text-gray-500">Current stage</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="text-sm text-gray-400 mb-2">💡 How the signal was determined:</div>
              <ul className="space-y-1">
                {pump.reasoning.map((reason, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">→</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top Mentions */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Top Reddit Mentions</h3>
            {topMentions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">📭 No Reddit mentions found</div>
                <div className="text-sm text-gray-500">
                  This could be due to:
                  <ul className="mt-2 space-y-1">
                    <li>• Reddit rate limiting (try again in a few minutes)</li>
                    <li>• No recent posts about this ticker</li>
                    <li>• Ticker not popular on monitored subreddits</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {topMentions.slice(0, 5).map((mention, i) => (
                  <div key={i} className="border-l-4 border-gray-600 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <a
                        href={mention.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2 group"
                      >
                        {mention.title}
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>r/{mention.subreddit}</span>
                      <span>u/{mention.author}</span>
                      <span>↑ {mention.upvotes}</span>
                      <span>💬 {mention.comments}</span>
                      <span className={`font-semibold ${
                        mention.sentiment.label === 'positive' ? 'text-green-400' :
                        mention.sentiment.label === 'negative' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {mention.sentiment.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
