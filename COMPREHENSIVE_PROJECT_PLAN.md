# Stock Sentiment Analyzer - Comprehensive Project Plan

## Executive Summary

**Project**: Personal Stock Sentiment Analyzer Web Application
**Goal**: Identify 5-10% gain opportunities by analyzing social media sentiment and detecting pump phases early
**Approach**: MVP-first development with sequential feature building and user validation at each milestone
**Timeline**: 4-6 development phases, each requiring user confirmation before proceeding

---

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [API Integration Strategy](#api-integration-strategy)
4. [UI/UX Design](#uiux-design)
5. [Database Schema](#database-schema)
6. [Development Phases](#development-phases)
7. [Agent Assignments](#agent-assignments)
8. [Risk Assessment](#risk-assessment)
9. [Success Metrics](#success-metrics)

---

## System Architecture

### High-Level Architecture (Text Diagram)

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Vite + React + TypeScript)                        │
├─────────────────────────────────────────────────────────────┤
│  Dashboard Component                                        │
│  ├── Stock Card (Price, Sentiment, Pump Phase)            │
│  ├── Price Chart (Lightweight-Charts)                     │
│  ├── Sentiment Timeline                                   │
│  └── Signal Indicator (Green/Yellow/Red)                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API (JSON)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  Backend (Node.js + Express + TypeScript)                           │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                 │
│  ├── /api/stock/:symbol (Get stock data)                  │
│  ├── /api/sentiment/:symbol (Get sentiment analysis)      │
│  ├── /api/mentions/:symbol (Get social media mentions)    │
│  └── /api/signals/:symbol (Get buy/sell signals)          │
│                                                             │
│  Services Layer                                            │
│  ├── RedditService (Fetch Reddit mentions)                │
│  ├── TwitterService (Fetch Twitter mentions)              │
│  ├── StockPriceService (Fetch price data)                 │
│  ├── NewsService (Fetch news mentions)                    │
│  ├── SentimentAnalyzer (VADER analysis)                   │
│  ├── PumpDetector (Identify pump phases)                  │
│  └── SignalGenerator (Generate buy/sell signals)          │
│                                                             │
│  Data Layer                                                │
│  ├── CacheManager (Redis/In-Memory)                       │
│  └── DatabaseManager (PostgreSQL)                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                          External APIs                                              │
├─────────────────────────────────────────────────────────────┤
│  ├── Reddit API (r/WallStreetBets, r/stocks, etc.)        │
│  ├── Twitter API v2 (Free tier - limited)                 │
│  ├── Alpha Vantage / Yahoo Finance (Stock prices)         │
│  └── NewsAPI / Google News RSS (News mentions)            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User requests stock analysis for ticker symbol (e.g., "TSLA")
   ↓
2. Backend checks cache for recent data (< 15 min old)
   ├─ Cache Hit: Return cached data immediately
   └─ Cache Miss: Proceed to data collection
   ↓
3. Parallel API calls to:
   ├─ Reddit API (fetch recent mentions)
   ├─ Twitter API (fetch recent tweets)
   ├─ Stock Price API (fetch current + historical prices)
   └─ News API (fetch recent news articles)
   ↓
4. Sentiment Analysis
   ├─ Run VADER on all text mentions (Reddit posts, tweets, headlines)
   ├─ Calculate aggregate sentiment score (-1 to +1)
   └─ Identify sentiment trend (improving, declining, neutral)
   ↓
5. Pump Phase Detection
   ├─ Analyze mention volume vs baseline
   ├─ Analyze sentiment trajectory
   ├─ Correlate with price movement
   └─ Classify phase: Early (⬆️), Mid (⚡), Late (⚠️), Post (📉)
   ↓
6. Signal Generation
   ├─ Green: Early pump + positive sentiment + low price
   ├─ Yellow: Mid pump or mixed signals, watch closely
   └─ Red: Late/post pump or negative sentiment, avoid
   ↓
7. Cache results for 15 minutes
   ↓
8. Store mention history in database for trend analysis
   ↓
9. Return JSON response to frontend
   ↓
10. Frontend displays dashboard with charts and signals
```

### Component Breakdown

#### Frontend Components
1. **App.tsx** - Main application shell
2. **Dashboard.tsx** - Main dashboard layout
3. **StockCard.tsx** - Individual stock display card
4. **PriceChart.tsx** - Price history chart (Lightweight-Charts)
5. **SentimentGauge.tsx** - Visual sentiment indicator
6. **PumpPhaseIndicator.tsx** - Pump phase visualization
7. **SignalBadge.tsx** - Color-coded buy/sell signal
8. **MentionTimeline.tsx** - Recent mentions from social media
9. **SearchBar.tsx** - Stock symbol search input

#### Backend Services
1. **RedditService.ts** - Reddit API integration
2. **TwitterService.ts** - Twitter API integration
3. **StockPriceService.ts** - Financial data API integration
4. **NewsService.ts** - News API integration
5. **SentimentAnalyzer.ts** - VADER sentiment analysis
6. **PumpDetector.ts** - Pump phase detection algorithm
7. **SignalGenerator.ts** - Buy/sell signal logic
8. **CacheManager.ts** - API response caching
9. **DatabaseManager.ts** - PostgreSQL data persistence

---

## Technology Stack

### Frontend
- **Build Tool**: Vite 5.x (fastest dev server, excellent TypeScript support)
- **Framework**: React 18.x (larger ecosystem than Lit, more UI libraries available)
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 3.x (rapid UI development)
- **Charts**: Lightweight-Charts 4.x (best performance for financial charts)
- **State Management**: Zustand 4.x (simple, lightweight, no boilerplate)
- **HTTP Client**: Axios 1.x (better error handling than fetch)
- **Icons**: Lucide-React (clean, modern icons)

**Justification for React over Lit**:
- Larger ecosystem of financial chart integrations
- More third-party libraries for sentiment visualization
- Better documentation for data visualization patterns
- Easier to find solutions for edge cases

### Backend
- **Runtime**: Node.js 20.x LTS
- **Framework**: Express 4.x (simple, well-documented, perfect for MVP)
- **Language**: TypeScript 5.x
- **Validation**: Zod 3.x (schema validation for API inputs)
- **HTTP Client**: Axios 1.x (for external API calls)
- **Scheduler**: node-cron 3.x (for periodic data fetching)
- **Sentiment**: vader-sentiment (JavaScript VADER implementation)

### Database & Caching
- **Primary Database**: PostgreSQL 16.x (JSONB support for flexible mention storage)
- **ORM**: Drizzle ORM 0.29.x (TypeScript-first, excellent type safety)
- **Caching**: Node-Cache (in-memory for MVP, Redis for production)

**Justification for PostgreSQL over SQLite**:
- Better concurrent read/write performance for cron jobs
- JSONB support for storing raw API responses
- Easier migration path to production
- Better full-text search for mention analysis

### Development Tools
- **Package Manager**: pnpm (faster than npm, better disk usage)
- **Linting**: ESLint 8.x + Prettier 3.x
- **Testing**: Vitest 1.x (Vite-native testing, faster than Jest)
- **API Testing**: Supertest (for endpoint testing)

---

## API Integration Strategy

### 1. Reddit Data Collection

**Recommended API**: Reddit JSON API (no auth required for read-only)
- **Endpoint**: `https://www.reddit.com/r/{subreddit}/search.json?q={ticker}&sort=new&limit=100`
- **Rate Limit**: ~60 requests per minute (unofficially)
- **Free Tier**: Yes (no API key needed for basic reads)
- **Data Available**: Post titles, text, score, comments count, timestamp
- **Subreddits to Monitor**:
  - r/WallStreetBets (highest volume, meme stocks)
  - r/stocks (more serious analysis)
  - r/investing (long-term focus)
  - r/StockMarket (general discussion)

**Alternative**: Official Reddit API (requires OAuth)
- **Rate Limit**: 60 requests per minute per user
- **Setup**: Requires Reddit app registration
- **Benefit**: More stable, official support
- **Drawback**: OAuth complexity

**PM Decision**: Start with JSON API (simpler), migrate to OAuth if rate limited

**Implementation Strategy**:
```typescript
// RedditService.ts
interface RedditMention {
  text: string;
  score: number;
  timestamp: Date;
  url: string;
  subreddit: string;
}

async function fetchRedditMentions(ticker: string): Promise<RedditMention[]> {
  // Fetch from multiple subreddits in parallel
  // Parse JSON response
  // Extract relevant fields
  // Cache for 15 minutes
}
```

### 2. Twitter/X Data Collection

**Challenge**: Twitter API free tier is very restrictive (500 tweets/month as of 2024)

**Recommended Approach**: Twitter API v2 Basic (Free)
- **Endpoint**: `/2/tweets/search/recent`
- **Rate Limit**: 500 tweets per month, 10 requests per month
- **Free Tier**: Yes (requires approved developer account)
- **Data Available**: Tweet text, metrics, timestamp
- **Query**: `$TSLA OR #TSLA lang:en -is:retweet`

**Alternative 1**: Nitter RSS/Scraping (unofficial)
- **Rate Limit**: Varies by instance
- **Free Tier**: Yes
- **Legal Concern**: Terms of Service violation risk
- **PM Decision**: Not recommended for MVP

**Alternative 2**: Skip Twitter for MVP
- **Benefit**: No API limitations
- **Drawback**: Missing significant sentiment data source
- **PM Decision**: Include Twitter with clear "limited data" disclaimer

**Implementation Strategy**:
```typescript
// TwitterService.ts
// Use monthly quota strategically:
// - Only search for user-requested stocks (not auto-refresh)
// - Cache aggressively (24 hours)
// - Focus on high-volume stocks that move markets
```

### 3. Stock Price Data

**Recommended API**: Alpha Vantage (Free Tier)
- **Endpoint**: TIME_SERIES_INTRADAY, TIME_SERIES_DAILY
- **Rate Limit**: 25 requests per day (500/day with free API key)
- **Free Tier**: Yes (API key required)
- **Data Available**: OHLCV (Open, High, Low, Close, Volume)
- **Historical Data**: Up to 20 years (daily), up to 1 month (intraday)

**Alternative**: Yahoo Finance (unofficial via `yahoo-finance2` npm package)
- **Rate Limit**: No official limit (best effort)
- **Free Tier**: Yes
- **Data Available**: Real-time prices, historical data, volume
- **Benefit**: More generous, no API key needed
- **Drawback**: Unofficial, could break anytime

**PM Decision**: Use Yahoo Finance as primary, Alpha Vantage as backup

**Implementation Strategy**:
```typescript
// StockPriceService.ts
import yahooFinance from 'yahoo-finance2';

async function getStockData(ticker: string) {
  try {
    // Try Yahoo Finance first (faster, more generous)
    const quote = await yahooFinance.quote(ticker);
    const history = await yahooFinance.historical(ticker, {
      period1: '1mo', // Last month
      interval: '1d'
    });
    return { quote, history };
  } catch (error) {
    // Fallback to Alpha Vantage
    return fetchFromAlphaVantage(ticker);
  }
}
```

### 4. News Data

**Recommended API**: NewsAPI.org (Free Tier)
- **Endpoint**: `/v2/everything?q={ticker}`
- **Rate Limit**: 100 requests per day (free tier)
- **Free Tier**: Yes (API key required)
- **Data Available**: Headlines, descriptions, source, publish date
- **Sources**: Major financial news (WSJ, Bloomberg, CNBC, etc.)

**Alternative**: Google News RSS (Free)
- **Endpoint**: `https://news.google.com/rss/search?q={ticker}`
- **Rate Limit**: No official limit
- **Free Tier**: Yes (no API key)
- **Data Available**: Headlines, links, publish date
- **Benefit**: Free, no registration
- **Drawback**: No full article text

**PM Decision**: Use both - NewsAPI for depth, Google RSS for breadth

**Implementation Strategy**:
```typescript
// NewsService.ts
async function fetchNewsMentions(ticker: string) {
  // Parallel fetch from both sources
  const [newsApiResults, googleRssResults] = await Promise.all([
    fetchNewsAPI(ticker),
    fetchGoogleRSS(ticker)
  ]);

  // Deduplicate by headline similarity
  // Combine and return unified format
}
```

### API Rate Limiting Strategy

**Problem**: Free tier APIs have strict limits
**Solution**: Multi-layer caching and intelligent refresh

```typescript
// CacheManager.ts
interface CacheStrategy {
  reddit: '15min',      // Social media changes frequently
  twitter: '24h',       // Very limited quota, cache aggressively
  stockPrice: '5min',   // Price updates frequently
  news: '1h',          // News doesn't change as often
  sentiment: '15min',   // Recalculate when source data refreshes
  signals: '15min'      // Recalculate when sentiment updates
}
```

**Refresh Strategy**:
1. **User-initiated**: When user searches for a stock, fetch fresh data
2. **Background cron**: Every 15 minutes, refresh stocks user is watching
3. **Cache hits**: Serve cached data if < TTL, no API calls
4. **Smart invalidation**: Invalidate cache during market hours only

### API Error Handling

```typescript
// Services will implement circuit breaker pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailTime?: Date;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    // If circuit is open (too many failures), return cached data
    if (this.isOpen()) {
      throw new Error('Circuit breaker open, using cached data');
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
}
```

---

## UI/UX Design

### Dashboard Layout (Text Wireframe)

```
┌────────────────────────────────────────────────────────┐
│  Stock Sentiment Analyzer                   [Profile] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Search: [_____________________] [Analyze]            │
│                                                        │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐ │
│  │  TSLA - Tesla Inc                    [$242.50]  │ │
│  │  ────────────────────────────────────────────── │ │
│  │                                                  │ │
│  │  Signal: 🟢 BUY OPPORTUNITY - Early Pump Phase  │ │
│  │                                                  │ │
│  │  Price Changes:                                 │ │
│  │  1d: +2.3% | 1w: +5.1% | 2w: +8.7%             │ │
│  │  1m: +12.4% | 3m: +18.9%                       │ │
│  │                                                  │ │
│  │  Sentiment Score: 0.67 (Positive) ↗️           │ │
│  │  Mention Volume: 847 (Last 24h) ⬆️ +45%        │ │
│  │                                                  │ │
│  │  Pump Phase: 🚀 EARLY (High Potential)         │ │
│  │  Confidence: 78%                                │ │
│  │                                                  │ │
│  │  [Price Chart - Last 30 Days]                   │ │
│  │   ┌────────────────────────────────────┐        │ │
│  │   │          Chart.js Area Chart       │        │ │
│  │   │          (Price + Volume)          │        │ │
│  │   └────────────────────────────────────┘        │ │
│  │                                                  │ │
│  │  Recent Mentions:                               │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  🔵 Reddit · r/WallStreetBets · 2h ago         │ │
│  │  "TSLA to the moon! Earnings beat..."          │ │
│  │  Sentiment: 0.82 (Positive) | Score: 1.2k      │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  🐦 Twitter · @trader123 · 3h ago              │ │
│  │  "$TSLA breaking resistance, long position..." │ │
│  │  Sentiment: 0.71 (Positive) | Likes: 234       │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ │
│  │  📰 News · CNBC · 5h ago                        │ │
│  │  "Tesla reports strong Q4 earnings..."         │ │
│  │  Sentiment: 0.45 (Slightly Positive)           │ │
│  │                                                  │ │
│  │  [Load More Mentions]                           │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Color-Coding System

**Signal Colors** (Semantic and clear):
- **🟢 Green**: BUY OPPORTUNITY
  - Criteria: Early pump phase + positive sentiment (>0.5) + price momentum
  - Message: "Strong buy signal detected"
  - Action: Consider buying for 5-10% gain target

- **🟡 Yellow**: WATCH CLOSELY
  - Criteria: Mid pump phase OR mixed sentiment (0.2 to 0.5) OR conflicting signals
  - Message: "Developing situation, monitor closely"
  - Action: Wait for stronger signal before buying

- **🔴 Red**: AVOID / SELL
  - Criteria: Late/post pump phase OR negative sentiment (<0.2) OR price declining
  - Message: "High risk, avoid buying"
  - Action: If already holding, consider taking profits

**Pump Phase Indicators**:
- **🚀 Early**: Low mention volume increasing, sentiment improving, price starting to rise
- **⚡ Mid**: High mention volume, strong positive sentiment, price rising rapidly
- **⚠️ Late**: Very high mention volume, sentiment at peak, price may be overextended
- **📉 Post**: Declining mention volume, sentiment turning negative, price falling

### Component Design Details

#### StockCard Component
```typescript
interface StockCardProps {
  ticker: string;
  companyName: string;
  currentPrice: number;
  priceChanges: {
    '1d': number;
    '1w': number;
    '2w': number;
    '1m': number;
    '3m': number;
  };
  sentiment: {
    score: number;        // -1 to +1
    trend: 'up' | 'down' | 'neutral';
    confidence: number;   // 0 to 1
  };
  pumpPhase: 'early' | 'mid' | 'late' | 'post';
  signal: 'buy' | 'watch' | 'avoid';
  mentions: {
    count: number;
    change: number;       // % change from baseline
  };
  recentMentions: Mention[];
}
```

**Visual Hierarchy**:
1. **Top**: Ticker, company name, current price (largest text)
2. **Signal Badge**: Color-coded, impossible to miss
3. **Price Changes**: Horizontal bar showing all timeframes
4. **Sentiment & Volume**: Key metrics in medium prominence
5. **Pump Phase**: Clear indicator with emoji and text
6. **Chart**: Visual price history
7. **Mentions**: Scrollable list of recent social media activity

#### PriceChart Component
```typescript
// Using Lightweight-Charts (best performance for financial data)
import { createChart } from 'lightweight-charts';

interface PriceChartProps {
  data: { time: string; value: number }[];
  volumeData: { time: string; value: number }[];
}

// Two-panel chart:
// Top: Price line chart with area fill
// Bottom: Volume bar chart
// Color: Green when price up, red when down
```

### Real-Time Update Strategy

**Problem**: How to show new data arriving without jarring user experience?

**Solution**: Subtle animations + update indicators
1. **New data badge**: Small pulsing indicator on StockCard
2. **Smooth transitions**: Price changes animate rather than jump
3. **Toast notifications**: For significant signal changes (e.g., "TSLA signal changed to BUY")
4. **Auto-refresh toggle**: User can enable/disable automatic updates

```typescript
// Update mechanism
const [autoRefresh, setAutoRefresh] = useState(true);

useEffect(() => {
  if (!autoRefresh) return;

  const interval = setInterval(() => {
    fetchStockData(ticker).then(data => {
      // Compare with current data
      if (hasSignificantChange(currentData, data)) {
        showToast(`${ticker} signal updated to ${data.signal}`);
      }
      // Smooth state update triggers CSS transitions
      setStockData(data);
    });
  }, 15 * 60 * 1000); // 15 minutes

  return () => clearInterval(interval);
}, [ticker, autoRefresh]);
```

### Mobile Responsiveness

**Strategy**: Mobile-first design with responsive breakpoints

```css
/* TailwindCSS breakpoints */
/* Mobile (default): Single column, stacked layout */
/* Tablet (md:768px): Two columns for stock cards */
/* Desktop (lg:1024px): Three columns, expanded charts */

/* Key mobile optimizations: */
/* - Collapsible mention lists */
/* - Horizontal scrolling for price changes */
/* - Tap targets minimum 44px */
/* - Charts responsive to viewport width */
```

---

## Database Schema

### PostgreSQL Schema (Using Drizzle ORM)

```typescript
// schema.ts

// Stocks table - Track which stocks user is monitoring
export const stocks = pgTable('stocks', {
  id: serial('id').primaryKey(),
  ticker: varchar('ticker', { length: 10 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }),
  isWatching: boolean('is_watching').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Mentions table - Store social media/news mentions
export const mentions = pgTable('mentions', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id),
  source: varchar('source', { length: 50 }), // 'reddit', 'twitter', 'news'
  sourceId: varchar('source_id', { length: 255 }), // External post ID
  text: text('text').notNull(),
  sentiment: decimal('sentiment', { precision: 3, scale: 2 }), // -1.00 to 1.00
  score: integer('score'), // Reddit score, Twitter likes, etc.
  url: varchar('url', { length: 500 }),
  publishedAt: timestamp('published_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),

  // Store raw API response for debugging
  rawData: jsonb('raw_data')
});

// Price history table - Store historical price data
export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  open: decimal('open', { precision: 10, scale: 2 }),
  high: decimal('high', { precision: 10, scale: 2 }),
  low: decimal('low', { precision: 10, scale: 2 }),
  close: decimal('close', { precision: 10, scale: 2 }),
  volume: bigint('volume', { mode: 'number' }),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Sentiment snapshots - Aggregate sentiment over time
export const sentimentSnapshots = pgTable('sentiment_snapshots', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id),
  avgSentiment: decimal('avg_sentiment', { precision: 3, scale: 2 }),
  mentionCount: integer('mention_count'),
  pumpPhase: varchar('pump_phase', { length: 20 }), // 'early', 'mid', 'late', 'post'
  signal: varchar('signal', { length: 20 }), // 'buy', 'watch', 'avoid'
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Indexes for performance
CREATE INDEX idx_mentions_stock_id ON mentions(stock_id);
CREATE INDEX idx_mentions_published_at ON mentions(published_at);
CREATE INDEX idx_price_history_stock_id ON price_history(stock_id);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX idx_sentiment_snapshots_stock_id ON sentiment_snapshots(stock_id);
```

### Data Retention Strategy

```typescript
// Periodic cleanup to prevent database bloat
// Run daily via cron job

async function cleanupOldData() {
  // Keep mentions for 30 days
  await db.delete(mentions)
    .where(lt(mentions.publishedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

  // Keep price history for 90 days
  await db.delete(priceHistory)
    .where(lt(priceHistory.timestamp, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)));

  // Keep sentiment snapshots for 90 days
  await db.delete(sentimentSnapshots)
    .where(lt(sentimentSnapshots.timestamp, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)));
}
```

---

## Development Phases

### Phase 1: MVP Core - Data Collection & Storage
**Goal**: Build backend that collects and stores stock data

**Features**:
1. Basic Express API server with TypeScript
2. PostgreSQL database setup with Drizzle ORM
3. Reddit data collection service
4. Stock price data collection (Yahoo Finance)
5. Database storage for mentions and prices
6. Basic API endpoint: `GET /api/stock/:ticker`

**Agent Assignments**:
- **Architecture Specialist**: Set up project structure, configure TypeScript, set up Drizzle
- **API Integration Specialist**: Implement Reddit and Yahoo Finance services
- **Performance Specialist**: Set up caching layer

**Success Criteria**:
- [ ] Server starts without errors
- [ ] Can fetch Reddit mentions for a stock ticker
- [ ] Can fetch stock price data
- [ ] Data is stored in PostgreSQL
- [ ] API endpoint returns combined data as JSON
- [ ] User validates by testing with real stock ticker

**Estimated Complexity**: Medium (2-3 days of development)

---

### Phase 2: Sentiment Analysis & Pump Detection
**Goal**: Implement VADER sentiment analysis and pump phase detection

**Features**:
1. VADER sentiment analysis on mentions
2. Sentiment aggregation and scoring
3. Pump phase detection algorithm
4. Signal generation logic (buy/watch/avoid)
5. API endpoint: `GET /api/sentiment/:ticker`
6. API endpoint: `GET /api/signals/:ticker`

**Agent Assignments**:
- **Performance Specialist**: Optimize VADER processing for batch analysis
- **Architecture Specialist**: Implement pump detection algorithm
- **API Integration Specialist**: Integrate sentiment into existing endpoints

**Pump Detection Algorithm**:
```typescript
// PumpDetector.ts

interface PumpPhase {
  phase: 'early' | 'mid' | 'late' | 'post';
  confidence: number;
}

function detectPumpPhase(data: {
  currentMentions: number;
  baselineMentions: number; // 30-day average
  sentimentScore: number;
  sentimentTrend: number;
  priceChange24h: number;
  volumeChange: number;
}): PumpPhase {
  const mentionIncrease = (data.currentMentions - data.baselineMentions) / data.baselineMentions;

  // Early phase: Mentions increasing, sentiment improving, price starting to move
  if (
    mentionIncrease > 0.5 && mentionIncrease < 2.0 &&
    data.sentimentScore > 0.4 &&
    data.sentimentTrend > 0 &&
    data.priceChange24h > 0 && data.priceChange24h < 5
  ) {
    return { phase: 'early', confidence: 0.75 };
  }

  // Mid phase: High mentions, strong sentiment, rapid price increase
  if (
    mentionIncrease > 2.0 && mentionIncrease < 5.0 &&
    data.sentimentScore > 0.6 &&
    data.priceChange24h > 5 && data.priceChange24h < 15
  ) {
    return { phase: 'mid', confidence: 0.80 };
  }

  // Late phase: Very high mentions, sentiment at peak, price possibly overextended
  if (
    mentionIncrease > 5.0 &&
    data.sentimentScore > 0.7 &&
    data.priceChange24h > 15
  ) {
    return { phase: 'late', confidence: 0.70 };
  }

  // Post phase: Mentions declining, sentiment turning negative, price falling
  if (
    mentionIncrease < 0 &&
    data.sentimentScore < 0.3 &&
    data.priceChange24h < 0
  ) {
    return { phase: 'post', confidence: 0.65 };
  }

  // Default: Not in pump phase
  return { phase: 'early', confidence: 0.3 };
}
```

**Success Criteria**:
- [ ] VADER accurately analyzes sentiment on test posts
- [ ] Pump detection correctly identifies phases on historical stocks
- [ ] Signal generation provides actionable buy/watch/avoid recommendations
- [ ] User validates by checking known pump stocks (e.g., GameStop 2021)

**Estimated Complexity**: Medium-High (3-4 days of development)

---

### Phase 3: Frontend Dashboard (MVP UI)
**Goal**: Build React dashboard to display stock analysis

**Features**:
1. React + Vite + TypeScript project setup
2. TailwindCSS styling configuration
3. Stock search bar component
4. Stock card component with all data points
5. Basic price chart (Lightweight-Charts)
6. Signal badge (green/yellow/red)
7. Responsive layout (mobile-first)

**Agent Assignments**:
- **UI Components Specialist**: Build all React components
- **Architecture Specialist**: Set up state management with Zustand
- **Web Development Expert**: Integrate with backend API

**Component Structure**:
```
src/
├── components/
│   ├── Dashboard.tsx
│   ├── SearchBar.tsx
│   ├── StockCard.tsx
│   ├── PriceChart.tsx
│   ├── SentimentGauge.tsx
│   ├── PumpPhaseIndicator.tsx
│   ├── SignalBadge.tsx
│   └── MentionTimeline.tsx
├── hooks/
│   ├── useStockData.ts
│   └── useAutoRefresh.ts
├── store/
│   └── stockStore.ts (Zustand)
├── services/
│   └── api.ts (Axios client)
├── types/
│   └── stock.ts
├── App.tsx
└── main.tsx
```

**Success Criteria**:
- [ ] Dashboard loads without errors
- [ ] User can search for a stock ticker
- [ ] Stock data displays correctly with all metrics
- [ ] Price chart renders historical data
- [ ] Signal colors match backend logic
- [ ] Mobile responsive layout works on phone screen
- [ ] User validates by testing with multiple tickers

**Estimated Complexity**: Medium (3-4 days of development)

---

### Phase 4: Twitter & News Integration
**Goal**: Add Twitter and news data sources for more comprehensive sentiment

**Features**:
1. Twitter API v2 integration (with free tier limits)
2. NewsAPI and Google News RSS integration
3. Deduplicate mentions across sources
4. Enhanced sentiment analysis with news headlines
5. Source indicator in mention timeline (Reddit/Twitter/News icons)

**Agent Assignments**:
- **API Integration Specialist**: Implement Twitter and news services
- **Performance Specialist**: Optimize deduplication and caching
- **UI Components Specialist**: Update mention timeline with source icons

**Data Deduplication Strategy**:
```typescript
// Avoid counting same event multiple times
// (e.g., news article shared on Reddit and Twitter)

function deduplicateMentions(mentions: Mention[]): Mention[] {
  // Use fuzzy text matching to identify duplicates
  // Keep the mention with highest engagement (score/likes)
  return mentions.filter((mention, index, self) => {
    return !self.slice(0, index).some(other =>
      textSimilarity(mention.text, other.text) > 0.85
    );
  });
}
```

**Success Criteria**:
- [ ] Twitter mentions appear in timeline (within quota limits)
- [ ] News headlines appear with sentiment analysis
- [ ] No duplicate mentions across sources
- [ ] User can distinguish Reddit vs Twitter vs News at a glance
- [ ] User validates with multiple data sources

**Estimated Complexity**: Medium (2-3 days of development)

---

### Phase 5: Real-Time Updates & Notifications
**Goal**: Add auto-refresh and signal change notifications

**Features**:
1. Auto-refresh mechanism (configurable interval)
2. WebSocket or polling for live updates (polling for MVP)
3. Toast notifications for signal changes
4. User preference for auto-refresh toggle
5. "Last updated" timestamp display
6. Manual refresh button

**Agent Assignments**:
- **Web Development Expert**: Implement polling mechanism
- **UI Components Specialist**: Build toast notification system
- **Performance Specialist**: Optimize polling to minimize API calls

**Implementation**:
```typescript
// useAutoRefresh.ts
function useAutoRefresh(ticker: string, enabled: boolean) {
  const [data, setData] = useState(null);
  const [lastSignal, setLastSignal] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      const newData = await api.getStockData(ticker);

      // Check if signal changed
      if (lastSignal && newData.signal !== lastSignal) {
        toast.info(`${ticker} signal changed to ${newData.signal.toUpperCase()}`);
      }

      setData(newData);
      setLastSignal(newData.signal);
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 15 * 60 * 1000); // 15 min

    return () => clearInterval(interval);
  }, [ticker, enabled]);

  return data;
}
```

**Success Criteria**:
- [ ] Auto-refresh updates data every 15 minutes
- [ ] Toast notification appears when signal changes
- [ ] User can toggle auto-refresh on/off
- [ ] Manual refresh button works instantly
- [ ] No unnecessary API calls (respects cache)
- [ ] User validates by watching live stock during market hours

**Estimated Complexity**: Low-Medium (1-2 days of development)

---

### Phase 6: Historical Analysis & Watchlist
**Goal**: Add historical sentiment trends and multi-stock watchlist

**Features**:
1. Sentiment trend chart (last 7 days)
2. Mention volume trend chart
3. Watchlist feature (save multiple stocks)
4. Watchlist dashboard view (multiple stock cards)
5. Historical accuracy tracking (were signals correct?)

**Agent Assignments**:
- **UI Components Specialist**: Build trend charts and watchlist UI
- **Architecture Specialist**: Implement watchlist data structure
- **Performance Specialist**: Optimize multi-stock data loading

**Watchlist Features**:
```typescript
// stockStore.ts (Zustand)
interface StockStore {
  watchlist: string[]; // Array of tickers
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  isWatching: (ticker: string) => boolean;
}

// Dashboard shows all watched stocks in grid
// Auto-refresh fetches data for all watched stocks
// Prioritize green (buy) signals at top of list
```

**Success Criteria**:
- [ ] User can add stocks to watchlist
- [ ] Watchlist persists across sessions (localStorage)
- [ ] Dashboard shows all watched stocks
- [ ] Historical trend charts display correctly
- [ ] User validates by building a personal watchlist

**Estimated Complexity**: Medium (2-3 days of development)

---

## Agent Assignments Summary

### Phase-by-Phase Agent Coordination

**Phase 1: MVP Core**
- **Architecture Specialist** (Lead): Project setup, database schema, API structure
- **API Integration Specialist**: Reddit + Yahoo Finance services
- **Performance Specialist**: Caching layer

**Phase 2: Sentiment Analysis**
- **Performance Specialist** (Lead): VADER optimization
- **Architecture Specialist**: Pump detection algorithm
- **API Integration Specialist**: Sentiment endpoint integration

**Phase 3: Frontend Dashboard**
- **UI Components Specialist** (Lead): All React components
- **Architecture Specialist**: State management setup
- **Web Development Expert**: API integration

**Phase 4: Additional Data Sources**
- **API Integration Specialist** (Lead): Twitter + news services
- **Performance Specialist**: Deduplication and caching
- **UI Components Specialist**: Source indicators in UI

**Phase 5: Real-Time Updates**
- **Web Development Expert** (Lead): Polling mechanism
- **UI Components Specialist**: Toast notifications
- **Performance Specialist**: Polling optimization

**Phase 6: Advanced Features**
- **UI Components Specialist** (Lead): Trend charts and watchlist
- **Architecture Specialist**: Watchlist data structure
- **Performance Specialist**: Multi-stock optimization

---

## Risk Assessment

### Technical Risks

**Risk 1: API Rate Limiting**
- **Probability**: HIGH
- **Impact**: HIGH (app unusable if over quota)
- **Mitigation**:
  - Aggressive caching (15-60 min TTL)
  - Fallback APIs (Yahoo Finance backup for Alpha Vantage)
  - User education (free tier limitations)
  - Queue system for API calls

**Risk 2: Sentiment Analysis Accuracy**
- **Probability**: MEDIUM
- **Impact**: HIGH (bad signals = bad trades = user loses money)
- **Mitigation**:
  - Start with VADER (proven library)
  - Validate on historical pumps (GME, AMC, etc.)
  - Display confidence scores to user
  - Clear disclaimer: "Tool for research, not financial advice"
  - User feedback mechanism to improve algorithm

**Risk 3: Twitter API Quota (500 tweets/month)**
- **Probability**: HIGH
- **Impact**: MEDIUM (limited data but not critical)
- **Mitigation**:
  - Cache Twitter data for 24 hours
  - Only fetch Twitter when user explicitly searches
  - Focus on Reddit and news (more generous quotas)
  - Clear "Limited Twitter data" indicator

**Risk 4: Database Growth**
- **Probability**: MEDIUM
- **Impact**: MEDIUM (storage costs, slow queries)
- **Mitigation**:
  - Data retention policy (30 days for mentions, 90 days for prices)
  - Automated cleanup cron job
  - Database indexes on frequently queried columns
  - Periodic VACUUM and ANALYZE (PostgreSQL maintenance)

**Risk 5: Pump Detection False Positives**
- **Probability**: MEDIUM
- **Impact**: HIGH (user buys based on false signal)
- **Mitigation**:
  - Conservative thresholds (high confidence required for "buy")
  - Yellow "watch" signal for uncertain cases
  - Show raw data (user can evaluate themselves)
  - Backtesting on historical data before launch

### Business Risks

**Risk 6: Legal/Compliance (Financial Advice)**
- **Probability**: LOW
- **Impact**: VERY HIGH (legal liability)
- **Mitigation**:
  - Clear disclaimer: "For educational purposes only, not financial advice"
  - No specific buy/sell recommendations (just sentiment analysis)
  - Terms of Service requiring user acknowledgment
  - Consult with legal expert before public launch

**Risk 7: User Misuse (Over-reliance on Tool)**
- **Probability**: MEDIUM
- **Impact**: HIGH (user loses money, blames tool)
- **Mitigation**:
  - Education content about pump-and-dump risks
  - Display confidence levels and uncertainties
  - Encourage diversification and risk management
  - User testimonials about responsible use

---

## Success Metrics

### Technical Performance Metrics

**API Performance**:
- Average API response time: < 500ms
- Cache hit rate: > 70%
- API error rate: < 1%
- Database query time: < 100ms

**Frontend Performance**:
- Dashboard load time (First Contentful Paint): < 2s
- Time to Interactive: < 3s
- Chart rendering time: < 500ms
- Auto-refresh performance overhead: Negligible

**Data Quality**:
- Sentiment analysis processing time: < 1s per mention
- Mention deduplication accuracy: > 90%
- Pump phase detection accuracy: TBD (validate with historical data)

### Business/User Metrics

**User Engagement**:
- Stocks analyzed per session: Target 3-5
- Watchlist size: Target 5-10 stocks
- Return visits: Target 3+ times per week
- Auto-refresh enabled: Target 60%+ users

**Signal Accuracy** (Validated with historical data):
- Green signal → 5-10% gain within 7 days: Target 60%+ success rate
- Red signal → Price decline or <5% gain: Target 70%+ success rate
- Overall signal precision: Target 65%+

**User Satisfaction**:
- User reports successful trades based on signals
- User trusts confidence scores
- User understands pump phases
- User feels informed, not misled

---

## Next Steps

### Immediate Actions (Project Manager)

1. **User Approval Required**:
   - Review this comprehensive plan
   - Approve tech stack decisions
   - Approve API selections
   - Approve development phase sequence
   - Provide any additional requirements or constraints

2. **Post-Approval Actions**:
   - Create project repository structure
   - Set up development environment
   - Initialize frontend and backend projects
   - Configure PostgreSQL database
   - Register for API keys (Reddit, NewsAPI, Alpha Vantage)

3. **Phase 1 Kickoff**:
   - Assign Architecture Specialist to project setup
   - Assign API Integration Specialist to Reddit/Yahoo services
   - Assign Performance Specialist to caching layer
   - Define success criteria for Phase 1
   - Schedule user validation checkpoint

### Development Timeline Estimate

**Total Estimated Development Time**: 15-20 days
- Phase 1: 2-3 days
- Phase 2: 3-4 days
- Phase 3: 3-4 days
- Phase 4: 2-3 days
- Phase 5: 1-2 days
- Phase 6: 2-3 days
- Testing & refinement: 2-3 days

**Note**: Timeline assumes:
- Sequential feature development (one phase at a time)
- User validation between phases (may extend timeline)
- No major blockers or API issues
- Solo developer working with agent assistance

---

## Appendices

### A. API Keys Required

1. **Reddit API** (Optional, but recommended):
   - Register at: https://www.reddit.com/prefs/apps
   - Create "script" application
   - Note client ID and secret

2. **Alpha Vantage** (Backup for Yahoo Finance):
   - Register at: https://www.alphavantage.co/support/#api-key
   - Free tier: 500 requests/day
   - Note API key

3. **NewsAPI** (News headlines):
   - Register at: https://newsapi.org/register
   - Free tier: 100 requests/day
   - Note API key

4. **Twitter API v2** (Optional, limited quota):
   - Register at: https://developer.twitter.com/en/portal/dashboard
   - Apply for Essential access (free)
   - Note Bearer Token

### B. Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- PostgreSQL (for database management)
- REST Client (for API testing)

### C. Environment Variables Template

```bash
# Backend .env file

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stock_sentiment

# APIs
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
NEWS_API_KEY=your_newsapi_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Server
PORT=3000
NODE_ENV=development

# Caching
CACHE_TTL_REDDIT=900        # 15 minutes
CACHE_TTL_TWITTER=86400     # 24 hours
CACHE_TTL_STOCK_PRICE=300   # 5 minutes
CACHE_TTL_NEWS=3600         # 1 hour
```

### D. Useful Libraries Reference

**Frontend**:
- `react`: UI framework
- `react-router-dom`: Routing (if multi-page)
- `zustand`: State management
- `axios`: HTTP client
- `lightweight-charts`: Financial charts
- `lucide-react`: Icons
- `react-hot-toast`: Toast notifications
- `tailwindcss`: CSS framework

**Backend**:
- `express`: Web framework
- `drizzle-orm`: TypeScript ORM
- `postgres`: PostgreSQL client
- `zod`: Schema validation
- `axios`: HTTP client for external APIs
- `vader-sentiment`: Sentiment analysis
- `node-cron`: Scheduled tasks
- `node-cache`: In-memory caching

---

**Document Status**: Complete - Ready for user review
**Last Updated**: 2025-10-24
**Project Manager**: Awaiting user approval to proceed with Phase 1
