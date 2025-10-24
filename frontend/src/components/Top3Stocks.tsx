import React, { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface TopStock {
  ticker: string;
  price: number;
  change1d: number;
  sentiment: number;
  sentimentLabel: 'positive' | 'neutral' | 'negative';
  mentionCount: number;
  weightedScore: number;
  signal: 'green' | 'yellow' | 'red';
  phase: 'early' | 'mid' | 'late' | 'post' | 'none';
  isPennyStock: boolean;
  marketCapFormatted: string;
  category: 'nano' | 'micro' | 'small' | 'mid' | 'large' | 'mega';
}

export const Top3Stocks: React.FC = () => {
  const [topStocks, setTopStocks] = useState<TopStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadTopStocks = async () => {
    setLoading(true);
    try {
      const data = await api.getTopStocksToday();
      setTopStocks(data.topStocks || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading top stocks:', error);
      toast.error('Failed to load top stocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopStocks();
  }, []);

  const signalColors = {
    green: 'bg-green-500/20 border-green-500',
    yellow: 'bg-yellow-500/20 border-yellow-500',
    red: 'bg-red-500/20 border-red-500',
  };

  const signalEmojis = {
    green: '🟢',
    yellow: '🟡',
    red: '🔴',
  };

  if (loading && topStocks.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <span className="ml-3 text-gray-400">Loading most talked about stocks...</span>
        </div>
      </div>
    );
  }

  if (topStocks.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h2 className="text-2xl font-bold">🔥 Top 3 Most Talked About Today</h2>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-sm text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadTopStocks}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topStocks.map((stock, index) => (
          <div
            key={stock.ticker}
            className={`${signalColors[stock.signal]} border-2 rounded-lg p-4 relative overflow-hidden`}
          >
            {/* Rank Badge */}
            <div className="absolute top-2 left-2 bg-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-yellow-400">
              #{index + 1}
            </div>

            {/* Penny Stock Badge */}
            {stock.isPennyStock && (
              <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                Penny
              </div>
            )}

            <div className="mt-8">
              {/* Ticker */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold">{stock.ticker}</h3>
                <span className="text-3xl">{signalEmojis[stock.signal]}</span>
              </div>

              {/* Price */}
              <div className="mb-3">
                <div className="text-2xl font-bold">${stock.price.toFixed(2)}</div>
                <div className={`text-sm ${stock.change1d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stock.change1d >= 0 ? '+' : ''}{stock.change1d.toFixed(2)}% today
                </div>
              </div>

              {/* Market Cap */}
              <div className="text-sm text-gray-400 mb-2">
                {stock.marketCapFormatted} • {stock.category} cap
              </div>

              {/* Mentions */}
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Mentions</span>
                <span className="font-semibold text-white">{stock.mentionCount}</span>
              </div>

              {/* Sentiment */}
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Sentiment</span>
                <span className={`font-semibold ${
                  stock.sentimentLabel === 'positive' ? 'text-green-400' :
                  stock.sentimentLabel === 'negative' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {stock.sentimentLabel} ({(stock.sentiment * 100).toFixed(0)})
                </span>
              </div>

              {/* Phase */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="text-xs text-gray-400 uppercase">Pump Phase</div>
                <div className="text-sm font-semibold capitalize">{stock.phase}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-400 text-center">
        <p>These stocks have the highest weighted activity across all trading subreddits (penny stock subs weighted higher)</p>
      </div>
    </div>
  );
};
