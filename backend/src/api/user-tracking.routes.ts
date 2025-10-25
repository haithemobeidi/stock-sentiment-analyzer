import { Router } from 'express';
import { userTrackingService } from '../services/user-tracking.service';

const router = Router();

/**
 * GET /api/users/tracked
 * Get all tracked users
 */
router.get('/tracked', async (req, res) => {
  try {
    const users = userTrackingService.getAllTrackedUsers();
    res.json({ users });
  } catch (error: any) {
    console.error('Error fetching tracked users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/top
 * Get top performing users
 */
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = userTrackingService.getTopUsers(limit);
    res.json({ users });
  } catch (error: any) {
    console.error('Error fetching top users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/track
 * Add a new user to track
 */
router.post('/track', async (req, res) => {
  try {
    const { platform, username, displayName } = req.body;

    if (!platform || !username) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'platform and username are required',
      });
    }

    const user = userTrackingService.addTrackedUser({
      platform,
      username,
      displayName,
    });

    res.json({ user, message: `Now tracking ${username} on ${platform}` });
  } catch (error: any) {
    console.error('Error adding tracked user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/users/track/:platform/:username
 * Stop tracking a user
 */
router.delete('/track/:platform/:username', async (req, res) => {
  try {
    const { platform, username } = req.params;

    const success = userTrackingService.removeTrackedUser(platform, username);

    if (!success) {
      return res.status(404).json({
        error: 'User not found',
        message: `${username} on ${platform} is not being tracked`,
      });
    }

    res.json({ message: `Stopped tracking ${username} on ${platform}` });
  } catch (error: any) {
    console.error('Error removing tracked user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:platform/:username/picks
 * Get all picks for a specific user
 */
router.get('/:platform/:username/picks', async (req, res) => {
  try {
    const { platform, username } = req.params;

    const user = userTrackingService.getUser(platform, username);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `${username} on ${platform} is not being tracked`,
      });
    }

    const picks = userTrackingService.getUserPicks(user.id);

    res.json({ user, picks });
  } catch (error: any) {
    console.error('Error fetching user picks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/picks/recent
 * Get recent picks from all tracked users
 */
router.get('/picks/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const picks = userTrackingService.getRecentPicks(limit);
    res.json({ picks });
  } catch (error: any) {
    console.error('Error fetching recent picks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users/picks
 * Record a new pick for a tracked user
 */
router.post('/picks', async (req, res) => {
  try {
    const { platform, username, ticker, sentiment, entryPrice, pickedAt, postUrl } = req.body;

    if (!platform || !username || !ticker || !sentiment || !entryPrice) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'platform, username, ticker, sentiment, and entryPrice are required',
      });
    }

    const pick = userTrackingService.recordPick({
      platform,
      username,
      ticker: ticker.toUpperCase(),
      sentiment,
      entryPrice,
      pickedAt: pickedAt ? new Date(pickedAt) : new Date(),
      postUrl,
    });

    if (!pick) {
      return res.status(404).json({
        error: 'User not tracked',
        message: `${username} on ${platform} must be added to tracking first`,
      });
    }

    res.json({ pick, message: 'Pick recorded successfully' });
  } catch (error: any) {
    console.error('Error recording pick:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/statistics
 * Get overall tracking statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = userTrackingService.getStatistics();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
