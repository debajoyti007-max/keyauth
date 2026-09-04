import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.post('/reset', async (req, res) => {
  try {
    const { user_key } = req.body;
    if (!user_key) {
      return res.status(400).json({ error: 'License key is required' });
    }

    const settings = await db.getSettings();
    if (!settings.allow_client_self_reset) {
      return res.status(403).json({
        error: 'Self-service device reset is disabled. Please contact your reseller or support.'
      });
    }

    const key = await db.getKey(user_key.trim());
    if (!key) {
      return res.status(404).json({ error: 'Invalid license key. Please check and try again.' });
    }

    if (key.status === 'banned') {
      return res.status(403).json({ error: 'This license key has been banned.' });
    }

    if (!key.hwid) {
      return res.status(200).json({
        success: true,
        message: 'This key is not bound to any device. You can use it directly in Free Fire!'
      });
    }

    // Check cooldown
    const cooldownHours = settings.client_reset_cooldown_hours || 24;
    const cooldownMs = cooldownHours * 3600 * 1000;

    if (key.last_reset_at) {
      const lastResetTime = new Date(key.last_reset_at).getTime();
      const elapsed = Date.now() - lastResetTime;
      if (elapsed < cooldownMs) {
        const remainingMs = cooldownMs - elapsed;
        const remHours = Math.floor(remainingMs / (3600 * 1000));
        const remMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
        return res.status(429).json({
          error: `Cooldown active. You can reset your device again in ${remHours}h ${remMins}m.`
        });
      }
    }

    await db.updateKey(key.user_key, {
      hwid: null,
      reset_count: (key.reset_count || 0) + 1,
      last_reset_at: new Date().toISOString()
    });

    await db.addActivityLog({
      game: key.game,
      duration: key.duration.toUpperCase(),
      devices: "1 Device",
      action: `Self-Service HWID Reset: ${key.user_key.substring(0, 8)}...`,
      status: "success"
    });

    return res.json({
      success: true,
      message: 'Device binding successfully reset! You can now log into Free Fire on your new device.'
    });
  } catch (err) {
    console.error('Error in public reset:', err);
    return res.status(500).json({ error: 'Internal server error during reset.' });
  }
});

export default router;
