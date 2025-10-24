import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Plus, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { StockCard } from './StockCard';
import { StockDetail } from './StockDetail';
import { Top3Stocks } from './Top3Stocks';
import { api, StockAnalysis } from '../services/api';

export const Dashboard: React.FC = () => {
  const [watchlist, setWatchlist] = useState<string[]>(['NVDA', 'TSLA', 'AAPL']);
  const [analyses, setAnalyses] = useState<Map<string, StockAnalysis>>(new Map());
  const [selectedStock, setSelectedStock] = useState<StockAnalysis | null>(null);
  const [newTicker, setNewTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load analyses for all stocks in watchlist
  const loadAllStocks = async () => {
    setLoading(true);
    const newAnalyses = new Map<string, StockAnalysis>();

    for (const ticker of watchlist) {
      try {
        const analysis = await api.analyzeStock(ticker);
        newAnalyses.set(ticker, analysis);
      } catch (error: any) {
        console.error(`Error loading ${ticker}:`, error);
        toast.error(`Failed to load ${ticker}`);
      }
    }

    setAnalyses(newAnalyses);
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    loadAllStocks();
  }, []);

  // Add ticker to watchlist
  const addTicker = async () => {
    const ticker = newTicker.trim().toUpperCase();

    if (!ticker) {
      toast.error('Please enter a ticker');
      return;
    }

    if (watchlist.includes(ticker)) {
      toast.error(`${ticker} is already in your watchlist`);
      return;
    }

    setLoading(true);
    try {
      const analysis = await api.analyzeStock(ticker);

      setWatchlist([...watchlist, ticker]);
      setAnalyses(new Map(analyses).set(ticker, analysis));
      setNewTicker('');
      toast.success(`Added ${ticker} to watchlist`);
    } catch (error: any) {
      console.error('Error adding ticker:', error);
      toast.error(`Failed to add ${ticker}. Check if ticker is valid.`);
    } finally {
      setLoading(false);
    }
  };

  // Remove ticker from watchlist
  const removeTicker = (ticker: string) => {
    setWatchlist(watchlist.filter((t) => t !== ticker));
    const newAnalyses = new Map(analyses);
    newAnalyses.delete(ticker);
    setAnalyses(newAnalyses);
    toast.success(`Removed ${ticker} from watchlist`);
  };

  // Refresh all data
  const refreshAll = async () => {
    setRefreshing(true);
    toast.loading('Refreshing all stocks...', { id: 'refresh' });

    try {
      await loadAllStocks();
      toast.success('All stocks refreshed!', { id: 'refresh' });
    } catch (error) {
      toast.error('Failed to refresh', { id: 'refresh' });
    } finally {
      setRefreshing(false);
    }
  };

  // Sort stocks by signal (green first, then yellow, then red)
  const sortedAnalyses = Array.from(analyses.values()).sort((a, b) => {
    const signalOrder = { green: 0, yellow: 1, red: 2 };
    return signalOrder[a.pump.signal] - signalOrder[b.pump.signal];
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">📊 Stock Sentiment Analyzer</h1>
          <p className="text-gray-400">Real-time pump detection with VADER sentiment analysis</p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex gap-4 items-center">
          {/* Add ticker input */}
          <div className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Add ticker (e.g., NVDA)"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addTicker()}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
              />
            </div>
            <button
              onClick={addTicker}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={refreshAll}
            disabled={refreshing || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Top 3 Most Talked About Today */}
        <Top3Stocks />

        {/* Your Watchlist */}
        {loading && analyses.size === 0 ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading stock data...</p>
          </div>
        ) : analyses.size === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No stocks in watchlist. Add one to get started!</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-2xl font-bold">📊 Your Watchlist</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAnalyses.map((analysis) => (
                <div key={analysis.ticker} className="relative">
                  <button
                    onClick={() => removeTicker(analysis.ticker)}
                    className="absolute -top-2 -right-2 z-10 bg-red-600 hover:bg-red-700 rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <StockCard analysis={analysis} onClick={() => setSelectedStock(analysis)} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Signal Legend */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Signal Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🟢</span>
              <div>
                <div className="font-semibold text-green-400">Green - Buy Opportunity</div>
                <div className="text-sm text-gray-400">Early pump phase or strong positive momentum. Potential entry point.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🟡</span>
              <div>
                <div className="font-semibold text-yellow-400">Yellow - Watch Closely</div>
                <div className="text-sm text-gray-400">Mid pump or mixed signals. Monitor before making decisions.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔴</span>
              <div>
                <div className="font-semibold text-red-400">Red - Avoid/Exit</div>
                <div className="text-sm text-gray-400">Late/post pump or negative sentiment. High risk, consider exiting.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 text-center">
          <p className="text-yellow-400 font-semibold">⚠️ Not Financial Advice</p>
          <p className="text-sm text-gray-400 mt-1">
            This tool is for educational purposes only. Always do your own research before making investment decisions.
          </p>
        </div>
      </main>

      {/* Stock Detail Modal */}
      {selectedStock && <StockDetail analysis={selectedStock} onClose={() => setSelectedStock(null)} />}
    </div>
  );
};
