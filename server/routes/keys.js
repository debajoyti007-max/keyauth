import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authMiddleware, requireRole } from './auth.js';

const router = express.Router();

function generateRandomKey(prefix = "MONTAGE") {
  const cleanPrefix = prefix.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
  const seg1 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const seg2 = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${cleanPrefix}-${seg1}-${seg2}`;
}

// GET all keys (filtered by permission)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'reseller') {
      filter.created_by = req.user.username;
    }
    const keys = await db.getKeys(filter);
    return res.json(keys);
  } catch (err) {
    console.error('Error fetching keys:', err);
    return res.status(500).json({ error: 'Failed to fetch keys' });
  }
});

// GENERATE KEYS (with Reseller Balance Deduction)
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const {
      duration = '7d',
      count = 1,
      prefix = 'MONTAGE-FF',
      game = 'FreeFire',
      max_devices = 1,
      notes = ''
    } = req.body;

    const numCount = Math.min(Math.max(1, parseInt(count) || 1), 50);
    const settings = await db.getSettings();

    // If reseller, check wallet balance
    if (req.user.role === 'reseller') {
      const prices = settings.reseller_prices || { '1d': 20, '7d': 100, '30d': 300, 'lifetime': 800 };
      const pricePerKey = prices[duration] || 100;
      const totalCost = pricePerKey * numCount;

      const user = await db.getUserById(req.user.id);
      if (!user || (user.balance || 0) < totalCost) {
        return res.status(400).json({
          error: `Insufficient wallet balance! Required: ₹${totalCost}, but your balance is ₹${user ? user.balance : 0}. Please contact Owner/Admin to top up.`
        });
      }

      // Deduct balance
      await db.updateUser(req.user.id, {
        balance: user.balance - totalCost
      });
    }

    const createdKeys = [];
    for (let i = 0; i < numCount; i++) {
      const user_key = generateRandomKey(prefix);
      const newKey = {
        id: user_key,
        user_key: user_key,
        game: game || settings.default_game || "FreeFire",
        duration: duration,
        status: "unused",
        hwid: null,
        max_devices: parseInt(max_devices) || 1,
        created_at: new Date().toISOString(),
        first_used_at: null,
        expires_at: null,
        paused_at: null,
        remaining_seconds_on_pause: 0,
        reset_count: 0,
        last_reset_at: null,
        created_by: req.user.username,
        notes: notes || ""
      };
      await db.createKey(newKey);
      createdKeys.push(newKey);
    }

    await db.addActivityLog({
      game: game || "FreeFire",
      duration: duration.toUpperCase(),
      devices: `${max_devices} Device(s)`,
      action: `Generated ${numCount} key(s) by ${req.user.username}`,
      status: "success"
    });

    return res.json({
      success: true,
      count: createdKeys.length,
      keys: createdKeys,
      key_strings: createdKeys.map(k => k.user_key)
    });
  } catch (err) {
    console.error('Error generating keys:', err);
    return res.status(500).json({ error: 'Failed to generate keys' });
  }
});

// PAUSE KEY (Time Freeze Engine)
router.post('/:id/pause', authMiddleware, async (req, res) => {
  try {
    const key = await db.getKey(req.params.id);
    if (!key) return res.status(404).json({ error: 'Key not found' });

    // Reseller check
    if (req.user.role === 'reseller' && key.created_by !== req.user.username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (key.status !== 'active') {
      return res.status(400).json({ error: 'Only currently active keys can be paused' });
    }

    if (!key.expires_at) {
      return res.status(400).json({ error: 'Lifetime keys cannot be paused' });
    }

    const now = Date.now();
    const expiry = new Date(key.expires_at).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiry - now) / 1000));

    const updated = await db.updateKey(key.user_key, {
      status: 'paused',
      paused_at: new Date().toISOString(),
      remaining_seconds_on_pause: remainingSeconds
    });

    await db.addActivityLog({
      game: key.game,
      duration: key.duration.toUpperCase(),
      devices: `${key.max_devices || 1} Device(s)`,
      action: `Key Paused: ${key.user_key.substring(0, 10)}... (${Math.floor(remainingSeconds / 3600)}h left preserved)`,
      status: "warning"
    });

    return res.json({ success: true, key: updated });
  } catch (err) {
    console.error('Error pausing key:', err);
    return res.status(500).json({ error: 'Failed to pause key' });
  }
});

// RESUME KEY (Restore Exact Preserved Time)
router.post('/:id/resume', authMiddleware, async (req, res) => {
  try {
    const key = await db.getKey(req.params.id);
    if (!key) return res.status(404).json({ error: 'Key not found' });

    if (req.user.role === 'reseller' && key.created_by !== req.user.username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (key.status !== 'paused') {
      return res.status(400).json({ error: 'Key is not currently paused' });
    }

    const remainingSecs = key.remaining_seconds_on_pause || 3600;
    const newExpiresAt = new Date(Date.now() + remainingSecs * 1000).toISOString();

    const updated = await db.updateKey(key.user_key, {
      status: 'active',
      paused_at: null,
      expires_at: newExpiresAt,
      remaining_seconds_on_pause: 0
    });

    await db.addActivityLog({
      game: key.game,
      duration: key.duration.toUpperCase(),
      devices: `${key.max_devices || 1} Device(s)`,
      action: `Key Resumed: ${key.user_key.substring(0, 10)}... (Preserved duration restored)`,
      status: "success"
    });

    return res.json({ success: true, key: updated });
  } catch (err) {
    console.error('Error resuming key:', err);
    return res.status(500).json({ error: 'Failed to resume key' });
  }
});

// RESET HWID
router.post('/:id/reset-hwid', authMiddleware, async (req, res) => {
  try {
    const key = await db.getKey(req.params.id);
    if (!key) return res.status(404).json({ error: 'Key not found' });

    if (req.user.role === 'reseller' && key.created_by !== req.user.username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await db.updateKey(key.user_key, {
      hwid: null,
      reset_count: (key.reset_count || 0) + 1,
      last_reset_at: new Date().toISOString()
    });

    await db.addActivityLog({
      game: key.game,
      duration: key.duration.toUpperCase(),
      devices: `${key.max_devices || 1} Device(s)`,
      action: `HWID Reset: ${key.user_key.substring(0, 10)}... by ${req.user.username}`,
      status: "success"
    });

    return res.json({ success: true, key: updated });
  } catch (err) {
    console.error('Error resetting HWID:', err);
    return res.status(500).json({ error: 'Failed to reset HWID' });
  }
});

// TOGGLE BAN/UNBAN
router.post('/:id/ban', authMiddleware, async (req, res) => {
  try {
    const key = await db.getKey(req.params.id);
    if (!key) return res.status(404).json({ error: 'Key not found' });

    if (req.user.role === 'reseller' && key.created_by !== req.user.username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const newStatus = key.status === 'banned' ? (key.first_used_at ? 'active' : 'unused') : 'banned';
    const updated = await db.updateKey(key.user_key, { status: newStatus });

    await db.addActivityLog({
      game: key.game,
      duration: key.duration.toUpperCase(),
      devices: `${key.max_devices || 1} Device(s)`,
      action: `Key ${newStatus === 'banned' ? 'Banned' : 'Unbanned'}: ${key.user_key.substring(0, 10)}...`,
      status: newStatus === 'banned' ? 'danger' : 'success'
    });

    return res.json({ success: true, key: updated });
  } catch (err) {
    console.error('Error banning key:', err);
    return res.status(500).json({ error: 'Failed to toggle ban' });
  }
});

// DELETE KEY
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const key = await db.getKey(req.params.id);
    if (!key) return res.status(404).json({ error: 'Key not found' });

    if (req.user.role === 'reseller' && key.created_by !== req.user.username) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.deleteKey(key.user_key);

    await db.addActivityLog({
      game: key.game,
      duration: key.duration.toUpperCase(),
      devices: `${key.max_devices || 1} Device(s)`,
      action: `Key Deleted: ${key.user_key.substring(0, 10)}... by ${req.user.username}`,
      status: "warning"
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting key:', err);
    return res.status(500).json({ error: 'Failed to delete key' });
  }
});

// BULK RESET ALL HWIDs (Owner & Admin only)
router.post('/bulk-reset', authMiddleware, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { game = "FreeFire" } = req.body;
    const allKeys = await db.getKeys();
    let resetCount = 0;

    for (const k of allKeys) {
      if (k.game.toLowerCase() === game.toLowerCase() && k.hwid) {
        await db.updateKey(k.user_key, {
          hwid: null,
          reset_count: (k.reset_count || 0) + 1,
          last_reset_at: new Date().toISOString()
        });
        resetCount++;
      }
    }

    await db.addActivityLog({
      game: game,
      duration: "ALL",
      devices: "ALL",
      action: `BULK HWID RESET: ${resetCount} keys reset by ${req.user.username}`,
      status: "danger"
    });

    return res.json({ success: true, count: resetCount });
  } catch (err) {
    console.error('Error in bulk reset:', err);
    return res.status(500).json({ error: 'Failed bulk reset' });
  }
});

export default router;
