import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db.js';
import { authMiddleware, requireRole } from './auth.js';

const router = express.Router();

// GET all users
router.get('/', authMiddleware, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const users = await db.getUsers();
    const sanitized = users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      level: u.level,
      balance: u.balance,
      status: u.status,
      created_at: u.created_at
    }));
    return res.json(sanitized);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// CREATE a new user (Admin or Reseller)
router.post('/', authMiddleware, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { username, password, role = 'reseller', initial_balance = 0 } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (role === 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only Owner can create Admin accounts.' });
    }

    const existing = await db.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const level = role === 'owner' ? 1 : role === 'admin' ? 2 : 3;

    const newUser = {
      id: 'usr_' + crypto.randomBytes(6).toString('hex'),
      username: username.trim().toLowerCase(),
      password_hash: password_hash,
      role: role,
      level: level,
      balance: parseFloat(initial_balance) || 0,
      status: 'active',
      created_at: new Date().toISOString()
    };

    await db.createUser(newUser);

    await db.addActivityLog({
      game: "SYSTEM",
      duration: "PERM",
      devices: "1 Account",
      action: `User Created: ${newUser.username} (${role.toUpperCase()})`,
      status: "success"
    });

    return res.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        level: newUser.level,
        balance: newUser.balance,
        status: newUser.status,
        created_at: newUser.created_at
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// ADD/DEDUCT BALANCE TO USER
router.post('/:id/balance', authMiddleware, requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { amount, action = 'add' } = req.body;
    const user = await db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const currentBalance = user.balance || 0;
    const newBalance = action === 'add' ? currentBalance + numAmount : Math.max(0, currentBalance - numAmount);

    const updated = await db.updateUser(user.id, { balance: newBalance });

    await db.addActivityLog({
      game: "WALLET",
      duration: "BALANCE",
      devices: "₹" + numAmount,
      action: `Balance ${action === 'add' ? 'Added' : 'Deducted'} for ${user.username}: ₹${numAmount} (New: ₹${newBalance})`,
      status: "success"
    });

    return res.json({
      success: true,
      balance: newBalance,
      user: {
        id: updated.id,
        username: updated.username,
        role: updated.role,
        balance: updated.balance
      }
    });
  } catch (err) {
    console.error('Error updating balance:', err);
    return res.status(500).json({ error: 'Failed to update balance' });
  }
});

// DELETE USER
router.delete('/:id', authMiddleware, requireRole('owner'), async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'owner') return res.status(400).json({ error: 'Cannot delete Owner account' });

    await db.deleteUser(user.id);

    await db.addActivityLog({
      game: "SYSTEM",
      duration: "PERM",
      devices: "1 Account",
      action: `User Deleted: ${user.username}`,
      status: "warning"
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
