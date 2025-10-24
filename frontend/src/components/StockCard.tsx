import React from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { StockAnalysis } from '../services/api';

interface StockCardProps {
  analysis: StockAnalysis;
  onClick?: () => void;
}

export const StockCard: React.FC<StockCardProps> = ({ analysis, onClick }) => {
  const { ticker, price, sentiment, pump } = analysis;

  // Determine background color based on signal
  const signalColors = {
    green: 'from-green-500/20 to-green-600/10 border-green-500/50',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/50',
    red: 'from-red-500/20 to-red-600/10 border-red-500/50',
  };

  const signalTextColors = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  const phaseEmojis = {
    early: '🚀',
    mid: '📈',
    late: '⚠️',
    post: '📉',
    none: '➖',
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const getPriceIcon = () => {
    if (price.change1d > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (price.change1d < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div
      className={`bg-gradient-to-br ${signalColors[pump.signal]} border rounded-lg p-6 cursor-pointer hover:scale-105 transition-transform duration-200`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white">{ticker}</h3>
          <p className={`text-sm ${signalTextColors[pump.signal]}`}>
            {phaseEmojis[pump.phase]} {pump.phase === 'none' ? 'Normal' : `${pump.phase} pump`}
          </p>
        </div>
        <div className={`text-3xl font-bold ${signalTextColors[pump.signal]}`}>
          {pump.signal === 'green' ? '🟢' : pump.signal === 'yellow' ? '🟡' : '🔴'}
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-3xl font-bold text-white">${price.current.toFixed(2)}</span>
          {getPriceIcon()}
        </div>
        <div className={`text-sm ${price.change1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatChange(price.change1d)} today
        </div>
      </div>

      {/* Sentiment Score */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Sentiment</span>
          <span>{sentiment.mentionCount} mentions</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
          <div
            className={`h-2 rounded-full ${
              sentiment.score > 0 ? 'bg-green-500' : sentiment.score < 0 ? 'bg-red-500' : 'bg-gray-500'
            }`}
            style={{ width: `${Math.abs(sentiment.score) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">{sentiment.label}</span>
          <span className="text-gray-400">{(sentiment.score * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Price Movements */}
      <div className="grid grid-cols-5 gap-2 mb-4 text-xs">
        {[
          { label: '1D', value: price.change1d },
          { label: '1W', value: price.change1w },
          { label: '2W', value: price.change2w },
          { label: '1M', value: price.change1m },
          { label: '3M', value: price.change3m },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-gray-400 mb-1">{item.label}</div>
            <div className={`font-semibold ${item.value && item.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.value ? formatChange(item.value) : 'N/A'}
            </div>
          </div>
        ))}
      </div>

      {/* Confidence & Volume */}
      <div className="flex justify-between text-xs text-gray-400 border-t border-gray-700 pt-3">
        <span>Confidence: {(pump.confidence * 100).toFixed(0)}%</span>
        <span>Volume: {price.volumeRatio.toFixed(1)}x avg</span>
      </div>
    </div>
  );
};
