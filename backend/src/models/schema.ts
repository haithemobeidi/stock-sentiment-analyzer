import { pgTable, serial, text, timestamp, real, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

/**
 * Stocks being tracked by the user
 */
export const stocks = pgTable('stocks', {
  id: serial('id').primaryKey(),
  ticker: text('ticker').notNull().unique(), // e.g., "NVDA", "TSLA"
  name: text('name'), // e.g., "NVIDIA Corporation"
  isActive: boolean('is_active').default(true), // Whether to actively track this stock
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Historical price data for stocks
 * Stores daily snapshots with various timeframe movements
 */
export const priceHistory = pgTable('price_history', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id).notNull(),
  ticker: text('ticker').notNull(), // Denormalized for faster queries

  // Price data
  currentPrice: real('current_price').notNull(),
  previousClose: real('previous_close'),

  // Movement calculations
  change1d: real('change_1d'), // 1 day % change
  change1w: real('change_1w'), // 1 week % change
  change2w: real('change_2w'), // 2 week % change
  change1m: real('change_1m'), // 1 month % change
  change3m: real('change_3m'), // 3 month % change

  // Volume data
  volume: real('volume'),
  avgVolume: real('avg_volume'), // Average volume for comparison

  // Metadata
  fetchedAt: timestamp('fetched_at').defaultNow(),
  source: text('source').default('yahoo'), // 'yahoo' or 'alphavantage'
});

/**
 * Social media mentions from various sources
 * Tracks individual mentions with sentiment
 */
export const mentions = pgTable('mentions', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id).notNull(),
  ticker: text('ticker').notNull(), // Denormalized for faster queries

  // Source information
  source: text('source').notNull(), // 'reddit', 'twitter', 'news'
  sourceId: text('source_id').unique(), // External ID to prevent duplicates
  url: text('url'), // Link to original post/article

  // Content
  title: text('title'),
  content: text('content'),
  author: text('author'),

  // Engagement metrics
  upvotes: integer('upvotes').default(0),
  comments: integer('comments').default(0),

  // Sentiment analysis
  sentimentScore: real('sentiment_score'), // VADER compound score (-1 to 1)
  sentimentLabel: text('sentiment_label'), // 'positive', 'neutral', 'negative'

  // Metadata
  postedAt: timestamp('posted_at'),
  fetchedAt: timestamp('fetched_at').defaultNow(),
});

/**
 * Aggregated sentiment data per stock
 * Calculated periodically from mentions table
 */
export const sentimentSnapshots = pgTable('sentiment_snapshots', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id).notNull(),
  ticker: text('ticker').notNull(),

  // Aggregated sentiment
  overallScore: real('overall_score'), // Weighted average (-1 to 1)
  positiveCount: integer('positive_count').default(0),
  neutralCount: integer('neutral_count').default(0),
  negativeCount: integer('negative_count').default(0),
  totalMentions: integer('total_mentions').default(0),

  // Source breakdown
  redditMentions: integer('reddit_mentions').default(0),
  twitterMentions: integer('twitter_mentions').default(0),
  newsMentions: integer('news_mentions').default(0),

  // Trends
  mentionTrend: text('mention_trend'), // 'rising', 'stable', 'declining'
  sentimentTrend: text('sentiment_trend'), // 'improving', 'stable', 'declining'

  // Pump phase detection
  pumpPhase: text('pump_phase'), // 'early', 'mid', 'late', 'post', 'none'
  signal: text('signal'), // 'green', 'yellow', 'red'
  confidence: real('confidence'), // 0-1 confidence in signal

  // Metadata
  calculatedAt: timestamp('calculated_at').defaultNow(),

  // Raw data for debugging
  rawData: jsonb('raw_data'), // Store calculation details
});

/**
 * User watchlist configuration
 */
export const watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  stockId: integer('stock_id').references(() => stocks.id).notNull(),
  ticker: text('ticker').notNull(),

  // User preferences
  notificationsEnabled: boolean('notifications_enabled').default(true),
  targetEntryPrice: real('target_entry_price'), // Price user wants to buy at
  targetExitPrice: real('target_exit_price'), // Price user wants to sell at

  // Metadata
  addedAt: timestamp('added_at').defaultNow(),
  notes: text('notes'), // User notes about this stock
});

/**
 * System logs for monitoring API calls and errors
 */
export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  level: text('level').notNull(), // 'info', 'warn', 'error'
  service: text('service').notNull(), // 'reddit', 'yahoo', 'vader', etc.
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});
