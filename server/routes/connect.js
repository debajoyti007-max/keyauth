import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';

const router = express.Router();

function formatEXPDate(dateObj) {
  if (!dateObj) return "2099-12-31 23:59:59";
  const d = new Date(dateObj);
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function calculateExpiryDate(duration) {
  const now = new Date();
  switch (duration) {
    case '1d':
      return new Date(now.getTime() + 1 * 86400000).toISOString();
    case '7d':
      return new Date(now.getTime() + 7 * 86400000).toISOString();
    case '30d':
      return new Date(now.getTime() + 30 * 86400000).toISOString();
    case 'lifetime':
      return new Date(now.getTime() + 36500 * 86400000).toISOString();
    default:
      return new Date(now.getTime() + 7 * 86400000).toISOString();
  }
}

// Handshake handler for C++ Android Client
async function handleConnect(req, res) {
  try {
    const game = (req.body.game || req.query.game || "").trim();
    const user_key = (req.body.user_key || req.query.user_key || "").trim();
    const serial = (req.body.serial || req.query.serial || "").trim();

    if (!user_key || !serial) {
      return res.status(200).json({
        status: false,
        reason: "Missing parameters: user_key and serial are required."
      });
    }

    const settings = await db.getSettings();
    if (settings.maintenance_mode) {
      return res.status(200).json({
        status: false,
        reason: "MONTAGE CORPORATION servers are currently in maintenance mode."
      });
    }

    const key = await db.getKey(user_key);
    if (!key) {
      return res.status(200).json({
        status: false,
        reason: "Invalid license key. Please verify and try again."
      });
    }

    // Check ban
    if (key.status === 'banned') {
      return res.status(200).json({
        status: false,
        reason: "This license key has been permanently banned."
      });
    }

    // Check pause
    if (key.status === 'paused') {
      return res.status(200).json({
        status: false,
        reason: "License key is currently paused by admin. Time freeze is active."
      });
    }

    // Check expiration
    if (key.status === 'expired' || (key.expires_at && new Date(key.expires_at) <= new Date())) {
      if (key.status !== 'expired') {
        await db.updateKey(user_key, { status: 'expired' });
      }
      return res.status(200).json({
        status: false,
        reason: "License key has expired. Please renew your subscription."
      });
    }

    // HWID Binding
    if (key.status === 'unused' || !key.hwid) {
      // First login: bind HWID and start duration countdown
      const expDate = calculateExpiryDate(key.duration);
      const updatedFields = {
        hwid: serial,
        status: 'active',
        first_used_at: new Date().toISOString(),
        expires_at: expDate
      };
      await db.updateKey(user_key, updatedFields);
      key.hwid = serial;
      key.expires_at = expDate;
      key.status = 'active';

      await db.addActivityLog({
        game: game || key.game || "FreeFire",
        duration: key.duration.toUpperCase(),
        devices: "1 Device(s)",
        action: `Key Activated & Bound: ${user_key.substring(0, 8)}...`,
        status: "success"
      });
    } else {
      // Key already bound: check HWID match
      if (key.hwid !== serial) {
        return res.status(200).json({
          status: false,
          reason: "HWID Mismatch! Key is locked to another device. Reset required."
        });
      }
    }

    // Compute cryptographic MD5 token expected by C++ client:
    // token = MD5(game + "-" + user_key + "-" + serial + "-" + secret_key)
    const activeGame = game || key.game || "FreeFire";
    const secretKey = settings.secret_key || "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";
    const tokenPayload = `${activeGame}-${user_key}-${serial}-${secretKey}`;
    const token = crypto.createHash('md5').update(tokenPayload).digest('hex');

    const formattedEXP = formatEXPDate(key.expires_at);
    const rng = Math.floor(Date.now() / 1000);

    // Log connection
    await db.addActivityLog({
      game: activeGame,
      duration: (key.duration || "7d").toUpperCase(),
      devices: "1 Device(s)",
      action: `Client Handshake Auth: ${user_key.substring(0, 8)}...`,
      status: "success"
    });

    return res.status(200).json({
      status: true,
      message: "Connected to MONTAGE CORPORATION successfully",
      data: {
        token: token,
        EXP: formattedEXP,
        rng: rng
      }
    });
  } catch (err) {
    console.error('Error in /connect endpoint:', err);
    return res.status(500).json({
      status: false,
      reason: "Internal server error during handshake."
    });
  }
}

// Support both /connect and / paths
router.post('/connect', handleConnect);
router.post('/', handleConnect);

export default router;
