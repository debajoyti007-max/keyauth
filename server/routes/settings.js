import express from 'express';
import { db } from '../db.js';
import { authMiddleware, requireRole } from './auth.js';

const router = express.Router();

// GET settings (Resellers see public settings, Owner/Admin see all)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await db.getSettings();
    if (req.user.role === 'reseller') {
      return res.json({
        site_name: settings.site_name,
        default_game: settings.default_game,
        announcement: settings.announcement,
        reseller_prices: settings.reseller_prices,
        allow_client_self_reset: settings.allow_client_self_reset
      });
    }
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// UPDATE settings (Owner only)
router.put('/', authMiddleware, requireRole('owner'), async (req, res) => {
  try {
    const {
      secret_key,
      site_name,
      default_game,
      maintenance_mode,
      allow_client_self_reset,
      client_reset_cooldown_hours,
      announcement,
      reseller_prices
    } = req.body;

    const updates = {};
    if (secret_key !== undefined) updates.secret_key = secret_key.trim();
    if (site_name !== undefined) updates.site_name = site_name.trim();
    if (default_game !== undefined) updates.default_game = default_game.trim();
    if (maintenance_mode !== undefined) updates.maintenance_mode = Boolean(maintenance_mode);
    if (allow_client_self_reset !== undefined) updates.allow_client_self_reset = Boolean(allow_client_self_reset);
    if (client_reset_cooldown_hours !== undefined) updates.client_reset_cooldown_hours = parseInt(client_reset_cooldown_hours) || 24;
    if (announcement !== undefined) updates.announcement = announcement.trim();
    if (reseller_prices !== undefined && typeof reseller_prices === 'object') updates.reseller_prices = reseller_prices;

    const updated = await db.updateSettings(updates);

    await db.addActivityLog({
      game: "CONFIG",
      duration: "SYSTEM",
      devices: "Settings",
      action: `Settings Updated by ${req.user.username}`,
      status: "success"
    });

    return res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
