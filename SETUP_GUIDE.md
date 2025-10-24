# Stock Sentiment Analyzer - Setup Guide

## Quick Start (Without Database)

The MVP can run **without PostgreSQL** for testing purposes. Some features will be limited but core functionality works.

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend will start on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

Visit `http://localhost:3000` to see the dashboard!

## Testing the Application

1. **Open the frontend** at `http://localhost:3000`
2. **Default stocks** (NVDA, TSLA, AAPL) will load automatically
3. **Add a stock**: Type a ticker (e.g., "GME") and click "Add"
4. **View details**: Click on any stock card to see detailed analysis
5. **Refresh data**: Click the "Refresh" button to update all stocks

## API Endpoints

Test the backend directly:

```bash
# Analyze a single stock
curl http://localhost:5000/api/stocks/NVDA/analyze

# Get price only
curl http://localhost:5000/api/stocks/NVDA/price

# Get sentiment only
curl http://localhost:5000/api/stocks/NVDA/sentiment

# Health check
curl http://localhost:5000/health
```

## Full Setup (With PostgreSQL)

### Prerequisites

- Node.js 18+
- PostgreSQL 16+ (optional but recommended for production)

### 1. Install PostgreSQL

**Ubuntu/WSL:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

### 2. Create Database

```bash
sudo -u postgres psql
```

In PostgreSQL:
```sql
CREATE DATABASE stock_sentiment;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE stock_sentiment TO your_username;
\q
```

### 3. Configure Backend

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/stock_sentiment
PORT=5000
NODE_ENV=development
```

### 4. Push Database Schema

```bash
cd backend
npm run db:push
```

This creates all the necessary tables using Drizzle ORM.

### 5. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env)

```env
# Required
PORT=5000
NODE_ENV=development

# Optional - for database features
DATABASE_URL=postgresql://username:password@localhost:5432/stock_sentiment

# Optional - for enhanced data access (uses free unauthenticated endpoints by default)
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
TWITTER_BEARER_TOKEN=
NEWS_API_KEY=
ALPHA_VANTAGE_API_KEY=
```

### Frontend (.env)

```env
# Optional - defaults to localhost:5000
VITE_API_URL=http://localhost:5000/api
```

## Features

### Working Now (MVP)
✅ VADER sentiment analysis
✅ Reddit mentions scraping
✅ Yahoo Finance price data
✅ Pump phase detection (early/mid/late/post)
✅ Color-coded signals (green/yellow/red)
✅ Price movement tracking (1d, 1w, 2w, 1m, 3m)
✅ Real-time watchlist management
✅ Detailed stock analysis view

### Coming Soon (Phase 2+)
⏳ Twitter/X integration
⏳ News aggregation
⏳ Historical sentiment trends
⏳ Price charts (Lightweight Charts integration)
⏳ Auto-refresh every 15 minutes
⏳ Desktop notifications

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use: `lsof -i :5000`
- Verify Node.js version: `node --version` (should be 18+)

### Frontend won't start
- Check if port 3000 is already in use: `lsof -i :3000`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### "Stock not found" errors
- Verify ticker symbol is correct (must be valid US stock ticker)
- Check if Yahoo Finance is accessible in your region

### No Reddit data
- Reddit's public JSON API has rate limits (~60 req/min)
- Wait a few minutes and try again
- Check console for rate limit messages

### Database connection failed
- Verify PostgreSQL is running: `sudo service postgresql status`
- Check connection string in `.env`
- Database is optional for MVP testing

## Performance Notes

- **First load**: Takes 10-20 seconds per stock (fetching from Reddit + Yahoo Finance)
- **Cached loads**: < 1 second (data cached for 15 minutes)
- **Recommended**: Start with 3-5 stocks, add more as needed
- **Rate limits**: Reddit allows ~60 requests/minute, Yahoo is more generous

## Development Commands

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (database GUI)
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Tech Stack Summary

**Backend:**
- Node.js + Express + TypeScript
- Drizzle ORM + PostgreSQL
- VADER Sentiment (JavaScript library)
- Axios for API calls
- Node-Cache for caching

**Frontend:**
- React 18 + Vite + TypeScript
- TailwindCSS for styling
- Lucide Icons
- React Hot Toast for notifications
- Axios for API client

## Next Steps

1. ✅ Test the MVP with real stocks
2. Add Twitter/X integration (Phase 2)
3. Implement historical sentiment charts
4. Add auto-refresh functionality
5. Create browser notifications for signal changes
6. Add user preferences and saved watchlists

## Support

If you encounter issues:
1. Check the console logs (both backend and frontend)
2. Verify all dependencies are installed
3. Ensure APIs are accessible (Reddit, Yahoo Finance)
4. Check rate limits haven't been exceeded

**Remember: This tool is for educational purposes only. Not financial advice!**
