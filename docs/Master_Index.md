# Master File Index

Complete catalog of all files in the Stock Sentiment Analyzer project.

---

## Documentation Files

- **CLAUDE.md** - Project guide and session protocols
- **README.md** - Project overview and features
- **SETUP_GUIDE.md** - Installation and setup instructions
- **docs/Master_Handoff.md** - Session summary index
- **docs/Master_Index.md** - This file
- **docs/handoffs/HANDOFF_TEMPLATE.md** - Template for session handoffs
- **docs/handoffs/Handoff_10-24-2025_12-38-29_EST.md** - Session 1 handoff
- **docs/handoffs/Handoff_10-24-2025_20-53-16_EST.md** - Session 2 handoff
- **docs/handoffs/Handoff_10-24-2025_21-05-38_EST.md** - Session 3 handoff

---

## Configuration Files

### Root
- **package.json** - Root package with concurrently scripts
- **.gitignore** - Git ignore patterns
- **start.sh** - One-command start script (executable)
- **test-api.sh** - API testing script (executable)

### Backend
- **backend/package.json** - Backend dependencies
- **backend/tsconfig.json** - TypeScript config
- **backend/drizzle.config.ts** - Drizzle ORM config
- **backend/.env** - Environment variables (gitignored)
- **backend/.env.example** - Environment template

### Frontend
- **frontend/package.json** - Frontend dependencies
- **frontend/tsconfig.json** - TypeScript config
- **frontend/tsconfig.node.json** - Node TypeScript config
- **frontend/vite.config.ts** - Vite build config
- **frontend/tailwind.config.js** - Tailwind CSS config
- **frontend/postcss.config.js** - PostCSS config
- **frontend/index.html** - HTML entry point

---

## Backend Source Files

### API Layer
- **backend/src/api/stock.routes.ts** - All stock API endpoints (440 lines)
  - GET /api/stocks/:ticker/analyze - Full stock analysis
  - GET /api/stocks/:ticker/price - Price data only
  - GET /api/stocks/:ticker/sentiment - Sentiment data only
  - POST /api/stocks/batch-analyze - Batch analysis
  - GET /api/stocks/trending - Weighted trending stocks
  - GET /api/stocks/top-today - Top 3 most talked about
- **backend/src/api/user-tracking.routes.ts** - User tracking endpoints (177 lines)
  - GET /api/users/tracked - Get all tracked users
  - GET /api/users/top - Get top performing users
  - POST /api/users/track - Add user to track
  - DELETE /api/users/track/:platform/:username - Stop tracking
  - GET /api/users/:platform/:username/picks - Get user's picks
  - GET /api/users/picks/recent - Recent picks from all users
  - POST /api/users/picks - Record new pick
  - GET /api/users/statistics - Tracking statistics

### Services Layer
- **backend/src/services/reddit.service.ts** - Reddit API integration with weighted scoring (270+ lines)
- **backend/src/services/yahoo.service.ts** - Yahoo Finance integration (230+ lines)
- **backend/src/services/sentiment.service.ts** - VADER sentiment analysis (180+ lines)
- **backend/src/services/pump-detection.service.ts** - Pump phase detection algorithm (170+ lines)
- **backend/src/services/finnhub.service.ts** - Finnhub social sentiment (Twitter+Reddit) (185 lines)
- **backend/src/services/alpha-vantage.service.ts** - Alpha Vantage news sentiment (273 lines)
- **backend/src/services/sentiment-aggregator.service.ts** - Multi-source aggregation (279 lines)
- **backend/src/services/user-tracking.service.ts** - User/influencer tracking system (346 lines)

### Utilities
- **backend/src/utils/stock-classifier.ts** - Market cap classification and suitability (131 lines)

### Models & Config
- **backend/src/models/schema.ts** - Database schema (Drizzle ORM)
- **backend/src/config/database.ts** - PostgreSQL connection
- **backend/src/types/index.ts** - Shared TypeScript types

### Server
- **backend/src/index.ts** - Express server entry point

---

## Frontend Source Files

### Components
- **frontend/src/components/Dashboard.tsx** - Main dashboard component (230+ lines)
- **frontend/src/components/StockCard.tsx** - Individual stock card display (130+ lines)
- **frontend/src/components/StockDetail.tsx** - Detailed stock analysis modal (270+ lines)
- **frontend/src/components/Top3Stocks.tsx** - Top 3 trending stocks section (157 lines)

### Services
- **frontend/src/services/api.ts** - API client with TypeScript interfaces (115 lines)

### Application
- **frontend/src/App.tsx** - Root React component
- **frontend/src/main.tsx** - React entry point
- **frontend/src/index.css** - Global styles with Tailwind

---

## Project Stats

### Lines of Code (Approximate)
- **Backend**: ~3,200 lines
- **Frontend**: ~1,000 lines
- **Documentation**: ~2,500 lines
- **Total**: ~6,700 lines

### File Count
- **Documentation**: 8 files
- **Configuration**: 13 files
- **Backend Source**: 16 files
- **Frontend Source**: 8 files
- **Total**: 45 files (excluding node_modules)

### Key Technologies
- **Backend**: TypeScript, Express, VADER, Axios, Drizzle
- **Frontend**: React, Vite, TailwindCSS, Zustand
- **APIs**: Reddit JSON, Yahoo Finance
- **Database**: PostgreSQL (optional)

---

## Build Outputs (Gitignored)

- **backend/dist/** - Compiled TypeScript
- **backend/drizzle/** - Database migrations
- **frontend/dist/** - Production build
- **node_modules/** - Dependencies (all 3 locations)

---

**Last Updated**: 10/24/2025 21:05:38 EST
**Total Files**: 46 (excluding builds and node_modules)
**Project Size**: ~6,700 lines of code
