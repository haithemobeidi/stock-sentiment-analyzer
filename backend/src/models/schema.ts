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

/**
 * Tracked influencers/users whose stock picks we want to monitor
 * Tracks performance of specific users from Reddit, StockTwits, etc.
 */
export const trackedUsers = pgTable('tracked_users', {
  id: serial('id').primaryKey(),
  platform: text('platform').notNull(), // 'reddit', 'stocktwits', 'twitter'
  username: text('username').notNull(), // Platform-specific username
  displayName: text('display_name'), // Human-readable name

  // Performance metrics
  totalPicks: integer('total_picks').default(0), // Total number of stock picks made
  successfulPicks: integer('successful_picks').default(0), // Picks that gained 5%+
  failedPicks: integer('failed_picks').default(0), // Picks that lost 5%+
  accuracyRate: real('accuracy_rate').default(0), // successfulPicks / totalPicks
  averageROI: real('average_roi').default(0), // Average % gain/loss across all picks

  // Reputation scoring
  reputationScore: real('reputation_score').default(0), // Weighted score 0-100
  trustLevel: text('trust_level').default('unverified'), // 'unverified', 'emerging', 'trusted', 'expert'

  // Activity tracking
  firstSeenAt: timestamp('first_seen_at').defaultNow(),
  lastPickAt: timestamp('last_pick_at'), // Most recent pick timestamp
  isActive: boolean('is_active').default(true), // Whether still actively tracked

  // Metadata
  addedAt: timestamp('added_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  notes: text('notes'), // Admin notes about this user

  // Unique constraint: one user per platform
  // Note: Drizzle ORM unique constraint syntax varies, manual SQL: UNIQUE(platform, username)
});

/**
 * Individual stock picks made by tracked users
 * Used to calculate user performance metrics
 */
export const userPicks = pgTable('user_picks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => trackedUsers.id).notNull(),
  ticker: text('ticker').notNull(), // Stock symbol picked

  // Pick details
  sentiment: text('sentiment').notNull(), // 'bullish', 'bearish', 'neutral'
  confidence: text('confidence'), // 'high', 'medium', 'low' (if mentioned)
  mentionType: text('mention_type').default('general'), // 'dd' (due diligence), 'yolo', 'general'

  // Price tracking
  entryPrice: real('entry_price'), // Price when pick was made
  currentPrice: real('current_price'), // Latest price (updated periodically)
  peakPrice: real('peak_price'), // Highest price reached after pick
  lowestPrice: real('lowest_price'), // Lowest price reached after pick

  // Performance metrics
  currentROI: real('current_roi').default(0), // (currentPrice - entryPrice) / entryPrice * 100
  peakROI: real('peak_roi').default(0), // Best ROI achieved
  worstROI: real('worst_roi').default(0), // Worst ROI reached

  // Outcome classification
  outcome: text('outcome'), // 'pending', 'successful', 'failed', 'neutral'
  outcomeResolvedAt: timestamp('outcome_resolved_at'), // When outcome was determined

  // Source information
  platform: text('platform').notNull(), // 'reddit', 'stocktwits'
  postUrl: text('post_url'), // Link to original post/comment
  postTitle: text('post_title'), // Original post title
  postContent: text('post_content'), // Original post text

  // Engagement metrics (from original post)
  upvotes: integer('upvotes').default(0),
  comments: integer('comments').default(0),

  // Timestamps
  pickedAt: timestamp('picked_at').notNull(), // When user made the pick
  fetchedAt: timestamp('fetched_at').defaultNow(), // When we detected the pick
  lastUpdatedAt: timestamp('last_updated_at').defaultNow(), // Last price update

  // Metadata
  rawData: jsonb('raw_data'), // Store original post data for reference
});
