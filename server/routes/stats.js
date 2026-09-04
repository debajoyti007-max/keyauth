import express from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole } from './auth.js';

const router = express.Router();

// GET dashboard statistics & activity stream
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'reseller') {
      filter.created_by = req.user.username;
    }

    const keys = await db.getKeys(filter);
    const users = await db.getUsers();
    const settings = await db.getSettings();
    const activity = await db.getActivityLogs(25);
    const currentUser = await db.getUserById(req.user.id);

    const totalKeys = keys.length;
    const activeKeys = keys.filter(k => k.status === 'active').length;
    const unusedKeys = keys.filter(k => k.status === 'unused').length;
    const expiredKeys = keys.filter(k => k.status === 'expired').length;
    const pausedKeys = keys.filter(k => k.status === 'paused').length;
    const resetCount = keys.reduce((sum, k) => sum + (k.reset_count || 0), 0);

    const adminsCount = users.filter(u => u.role === 'admin').length;
    const resellersCount = users.filter(u => u.role === 'reseller').length;
    const totalUsersCount = users.length;

    return res.json({
      stats: {
        total_keys: totalKeys,
        active_keys: activeKeys,
        unused_keys: unusedKeys,
        expired_keys: expiredKeys,
        paused_keys: pausedKeys,
        reset_count: resetCount,
        admins_count: adminsCount,
        resellers_count: resellersCount,
        total_users_count: totalUsersCount
      },
      user: {
        id: currentUser ? currentUser.id : req.user.id,
        username: currentUser ? currentUser.username : req.user.username,
        role: currentUser ? currentUser.role : req.user.role,
        level: currentUser ? currentUser.level : req.user.level,
        balance: currentUser ? currentUser.balance : 0
      },
      settings: {
        site_name: settings.site_name,
        default_game: settings.default_game,
        maintenance_mode: settings.maintenance_mode,
        announcement: settings.announcement,
        secret_key: req.user.role === 'owner' ? settings.secret_key : undefined
      },
      activity: activity
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// CLEAR Activity logs
router.post('/activity/clear', authMiddleware, requireRole('owner', 'admin'), async (req, res) => {
  try {
    await db.clearActivityLogs();
    return res.json({ success: true, message: 'Activity log cleared' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear activity' });
  }
});

export default router;
