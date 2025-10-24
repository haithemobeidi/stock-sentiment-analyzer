# Stock Sentiment Analyzer

A personal stock sentiment analysis tool that scans social media (Reddit, Twitter, news) to identify pump opportunities with color-coded visual signals.

## Features

- **VADER Sentiment Analysis** - Fast, accurate social media sentiment scoring
- **Multi-Source Data** - Reddit, Twitter/X, financial news aggregation
- **Pump Phase Detection** - Early/Mid/Late/Post pump identification
- **Color-Coded Signals** - Green (buy), Yellow (watch), Red (avoid)
- **Price Movement Tracking** - 1d, 1w, 2w, 1m, 3m price changes
- **Visual Dashboard** - Real-time charts and sentiment gauges

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Drizzle ORM
- VADER Sentiment Analysis
- Reddit API, Yahoo Finance, NewsAPI

### Frontend
- React 18 + Vite + TypeScript
- TailwindCSS for styling
- Lightweight Charts for price visualization
- Zustand for state management

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 16+
- API Keys (optional for enhanced features)

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Database Setup**
```bash
cd backend
npm run db:push
```

## Project Structure

```
stock-sentiment-analyzer/
├── backend/
│   ├── src/
│   │   ├── api/          # Express routes
│   │   ├── services/     # Business logic (Reddit, Yahoo Finance, VADER)
│   │   ├── models/       # Database models (Drizzle)
│   │   ├── utils/        # Helper functions
│   │   ├── config/       # Configuration
│   │   └── types/        # TypeScript types
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Helper functions
│   └── package.json
└── docs/
    └── COMPREHENSIVE_PROJECT_PLAN.md
```

## Usage

1. Add stock tickers to your watchlist
2. System fetches data every 15 minutes
3. View real-time sentiment scores and pump phases
4. Get color-coded buy/watch/avoid signals
5. Track price movements and sentiment trends

## Disclaimer

**NOT FINANCIAL ADVICE** - This tool is for educational and informational purposes only. Always do your own research before making investment decisions.

## Development Phases

- [x] Phase 1: Backend core (Reddit + Yahoo Finance)
- [ ] Phase 2: VADER sentiment + pump detection
- [ ] Phase 3: Frontend dashboard
- [ ] Phase 4: Additional data sources (Twitter, news)
- [ ] Phase 5: Real-time updates
- [ ] Phase 6: Advanced features (historical trends, watchlist)

## License

MIT
