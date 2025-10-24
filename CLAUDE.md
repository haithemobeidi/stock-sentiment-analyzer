# Stock Sentiment Analyzer - Project Guide

## Project Overview
Full-stack web application that analyzes Reddit sentiment and stock prices to identify pump opportunities for low capital traders. Uses VADER sentiment analysis with weighted subreddit scoring (penny stocks prioritized) to catch 5-10% gains on affordable stocks.

---

## Current Status

### ✅ What Works
- VADER sentiment analysis on social media posts
- Reddit API integration across 13 subreddits (penny stocks weighted 3x)
- Yahoo Finance real-time and historical price data (1d, 1w, 2w, 1m, 3m)
- Pump phase detection algorithm (early/mid/late/post/none)
- Color-coded trading signals (green/yellow/red)
- Market cap classification (nano/micro/small/mid/large/mega)
- Low capital suitability analysis
- "Top 3 Most Talked About Today" trending section
- Penny stock badges and identification
- Beautiful React dashboard with dark mode
- One-command start system (`npm start`)
- PostgreSQL support (optional - works without database)

### 🚧 Known Limitations
- No Twitter/X integration yet (API quota limits)
- No news aggregation yet
- No historical sentiment charts
- No auto-refresh (manual refresh only)
- No desktop notifications
- Reddit rate limiting (~60 req/min) can cause empty mentions

---

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- VADER Sentiment Analysis (vader-sentiment npm)
- Reddit JSON API (no auth required)
- Yahoo Finance API (free, unlimited)
- PostgreSQL + Drizzle ORM (optional)
- Node-Cache for API rate limit management

### Frontend
- React 18 + Vite + TypeScript
- TailwindCSS for styling
- Lucide Icons
- React Hot Toast for notifications
- Lightweight-Charts ready (not implemented yet)

---

## Key Features

### Weighted Subreddit Scoring
```
Penny Stock Focused (3.0-2.0x weight):
- r/pennystocks (3.0x)
- r/RobinHoodPennyStocks (2.5x)
- r/Shortsqueeze (2.5x)
- r/smallstreetbets (2.0x)

High Volume Retail (2.0-1.5x weight):
- r/wallstreetbets (2.0x)
- r/WallStreetbetsELITE (1.5x)
- r/swingtrading (1.5x)

General Trading (1.0x weight):
- r/stocks, r/investing, r/StockMarket, r/options, r/Daytrading, r/Trading

Final Score = (Upvotes + 1) × Subreddit Weight
```

### Pump Phase Detection
- **Early**: Rising mentions, improving sentiment, price starting to move (2-15%)
- **Mid**: High mentions, strong sentiment, rapid price increase (10-30%)
- **Late**: Extreme sentiment, overextended price (>25%), mentions declining
- **Post**: Declining mentions, negative sentiment, price falling

### Market Cap Classification
- **Nano**: < $50M (very risky, often penny stocks)
- **Micro**: $50M - $300M (penny stocks, high volatility)
- **Small**: $300M - $2B (emerging companies)
- **Mid**: $2B - $10B (established companies)
- **Large**: $10B - $200B (major companies)
- **Mega**: > $200B (giants like AAPL, MSFT)

---

## Quick Start

### Development
```bash
# One-command start (easiest)
npm start

# Or use the script
./start.sh

# Manual (if needed)
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

### First Time Setup
```bash
npm run install:all    # Install all dependencies
```

### Build for Production
```bash
cd backend && npm run build
cd frontend && npm run build
```

---

## Project Structure

```
stock-sentiment-analyzer/
├── backend/
│   ├── src/
│   │   ├── api/                  # Express routes
│   │   │   └── stock.routes.ts   # All stock endpoints
│   │   ├── services/             # Business logic
│   │   │   ├── reddit.service.ts        # Reddit scraping with weights
│   │   │   ├── yahoo.service.ts         # Yahoo Finance integration
│   │   │   ├── sentiment.service.ts     # VADER implementation
│   │   │   └── pump-detection.service.ts # Pump phase algorithm
│   │   ├── models/
│   │   │   └── schema.ts         # Database schema (Drizzle)
│   │   ├── utils/
│   │   │   └── stock-classifier.ts # Market cap classification
│   │   ├── config/
│   │   │   └── database.ts       # PostgreSQL connection
│   │   └── index.ts              # Express server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx     # Main app component
│   │   │   ├── StockCard.tsx     # Individual stock cards
│   │   │   ├── StockDetail.tsx   # Detailed analysis modal
│   │   │   └── Top3Stocks.tsx    # Trending stocks section
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── handoffs/                 # Session handoff files
├── package.json                  # Root (concurrently scripts)
├── SETUP_GUIDE.md
└── README.md
```

---

## API Endpoints

### Stock Analysis
```bash
# Analyze single stock
GET /api/stocks/:ticker/analyze

# Get price only
GET /api/stocks/:ticker/price

# Get sentiment only
GET /api/stocks/:ticker/sentiment

# Batch analyze multiple stocks
POST /api/stocks/batch-analyze
Body: { "tickers": ["NVDA", "TSLA", "AAPL"] }

# Get trending stocks (weighted scoring)
GET /api/stocks/trending

# Get top 3 most talked about today
GET /api/stocks/top-today

# Health check
GET /health
```

---

## Testing Expectations

**User is the primary tester.** Build features, commit to git, let user test with real stocks, get confirmation before marking tasks complete.

### Test Stocks to Try
- **Mega/Large cap**: NVDA, TSLA, AAPL, MSFT
- **Penny stocks**: AMC, GME, BBBY, WISH, SOFI
- **Low volume**: Try obscure tickers to test error handling

---

## Important Reminders

- **Commit frequently** - After each working feature
- **Use weighting properly** - Penny stock mentions count 3x more
- **Test signals** - Green/yellow/red should make sense given data
- **Rate limits** - Reddit ~60 req/min, cache for 15min
- **No database required** - App works without PostgreSQL
- **User confirmation** - Don't assume features work without testing
- **Keep files organized** - Backend services, frontend components separate

---

## End Session Protocol

When user says "end session", "wrap up", or similar:

1. **Create detailed handoff file**: `docs/handoffs/Handoff_MM-DD-YYYY_HH-MM-SS_EST.md`
   - Use EST timezone
   - Include sections:
     - Session Focus
     - Problems Identified
     - Solutions Implemented
     - What Works Now
     - What Still Doesn't Work
     - Code Changes This Session
     - Next Session Tasks
     - Testing Results
     - File Structure (if changed)
     - Session Statistics

2. **Update docs/Master_Handoff.md** (if exists) with 1-2 sentence summary

3. **Update docs/Master_Index.md** (if exists) if new files were created

4. **Commit all changes** with descriptive message:
   ```bash
   git add -A
   git commit -m "Descriptive message about what changed"
   ```

5. **Create git tag** (semantic versioning):
   - Patch (bug fixes): v1.0.x → v1.0.(x+1)
   - Minor (new features): v1.x.0 → v1.(x+1).0
   - Major (breaking changes): vx.0.0 → v(x+1).0.0
   ```bash
   git tag -a v1.1.0 -m "Added penny stock weighting and Top 3 section"
   ```

6. **Push to GitHub**:
   ```bash
   git push && git push --tags
   ```

7. **Create GitHub release** (optional but recommended):
   ```bash
   gh release create v1.1.0 --title "v1.1.0 - Penny Stock Focus" --notes "Release notes here"
   ```

---

## GitHub

- **Repo:** https://github.com/haithemobeidi/stock-sentiment-analyzer (public)
- **Latest Version:** Check `git tag -l` or GitHub releases
- **Branch:** main

---

## Development Workflow

### Starting a Session
1. Read latest handoff file (if exists)
2. Check GitHub for latest code
3. Run `npm start` to verify everything works
4. Review what user wants to build/fix

### During Session
1. Make changes
2. Test locally
3. Commit working features frequently
4. Get user confirmation before moving to next task

### Ending Session
1. Follow End Session Protocol above
2. Ensure all changes are committed and pushed
3. Create handoff file
4. Tag and release if significant changes

---

## Common Tasks

### Adding a New Subreddit
Edit `backend/src/services/reddit.service.ts`:
```typescript
private readonly targetSubreddits = [
  { name: 'newsubreddit', weight: 2.0, category: 'penny' },
  // ...
];
```

### Changing Weight Algorithm
Edit `backend/src/services/pump-detection.service.ts`:
- Modify `classifyPumpPhase()` method
- Adjust thresholds for early/mid/late phases

### Adding New Stock Classification
Edit `backend/src/utils/stock-classifier.ts`:
- Add new category to `StockClass` type
- Update `classifyByMarketCap()` logic

---

## Troubleshooting

### Backend won't start
```bash
# Check port 5000 availability
lsof -i :5000

# Verify Node version
node --version  # Should be 18+

# Check logs
cd backend && npm run dev
```

### Frontend won't start
```bash
# Check port 3000 availability
lsof -i :3000

# Clear cache and reinstall
rm -rf frontend/node_modules
cd frontend && npm install
```

### No Reddit data appearing
- Rate limit hit (wait 1-5 minutes)
- Invalid ticker (verify on Yahoo Finance)
- Subreddit API down (rare)

### Stock shows "N/A" for price movements
- Yahoo Finance doesn't have historical data (new IPO, delisted stock)
- Weekend/market closed (some data unavailable)

---

## Next Features to Consider

Priority ideas for future sessions:
1. **Twitter/X Integration** - Add Twitter sentiment data
2. **Auto-refresh** - Update Top 3 every 15 minutes
3. **Price Charts** - Lightweight Charts with sentiment overlay
4. **News Aggregation** - NewsAPI + Google News RSS
5. **Desktop Notifications** - Alert when signals change
6. **Watchlist Persistence** - Save to database
7. **Historical Sentiment** - Chart sentiment trends over time
8. **Backtesting** - Test algorithm on historical pumps (GME, AMC)
9. **Portfolio Tracking** - Track actual buys/sells and P/L
10. **Mobile Responsive** - Improve mobile UX

---

**Status**: MVP complete and functional
**Focus**: Penny stock identification for low capital traders
**Goal**: Catch 5-10% gains on affordable stocks using weighted Reddit sentiment
