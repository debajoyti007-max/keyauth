import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { getFirestore } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'database.json');

const DEFAULT_SECRET = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";

function getInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync("admin123", salt);

  const now = new Date();
  const dateStr = (days) => new Date(now.getTime() + days * 86400000).toISOString();
  const pastStr = (days) => new Date(now.getTime() - days * 86400000).toISOString();

  return {
    settings: {
      secret_key: DEFAULT_SECRET,
      site_name: "MONTAGE CORPORATION",
      default_game: "FreeFire",
      maintenance_mode: false,
      allow_client_self_reset: true,
      client_reset_cooldown_hours: 24,
      announcement: "MONTAGE CORPORATION V1.0 • All systems operational & 100% undetected.",
      reseller_prices: {
        "1d": 20,
        "7d": 100,
        "30d": 300,
        "lifetime": 800
      }
    },
    users: [
      {
        id: "usr_owner_01",
        username: "admin",
        password_hash: password_hash,
        role: "owner",
        level: 1,
        balance: 999690584,
        status: "active",
        created_at: pastStr(30)
      },
      {
        id: "usr_reseller_01",
        username: "reseller_alex",
        password_hash: password_hash,
        role: "reseller",
        level: 3,
        balance: 2500,
        status: "active",
        created_at: pastStr(15)
      },
      {
        id: "usr_reseller_02",
        username: "reseller_vortex",
        password_hash: password_hash,
        role: "reseller",
        level: 3,
        balance: 1200,
        status: "active",
        created_at: pastStr(10)
      }
    ],
    keys: [
      {
        id: "MONTAGE-FF-VIP-01",
        user_key: "MONTAGE-FF-VIP-01",
        game: "FreeFire",
        duration: "30d",
        status: "active",
        hwid: "8c91a021-99ef-4bf6-b4d2-f67b5e40e21a",
        max_devices: 1,
        created_at: pastStr(10),
        first_used_at: pastStr(10),
        expires_at: dateStr(20),
        paused_at: null,
        remaining_seconds_on_pause: 0,
        reset_count: 0,
        last_reset_at: null,
        created_by: "admin",
        notes: "VIP Customer"
      },
      {
        id: "MONTAGE-FF-7D-02",
        user_key: "MONTAGE-FF-7D-02",
        game: "FreeFire",
        duration: "7d",
        status: "active",
        hwid: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        max_devices: 1,
        created_at: pastStr(2),
        first_used_at: pastStr(2),
        expires_at: dateStr(5),
        paused_at: null,
        remaining_seconds_on_pause: 0,
        reset_count: 0,
        last_reset_at: null,
        created_by: "admin",
        notes: "Regular"
      },
      {
        id: "MONTAGE-FF-7D-03",
        user_key: "MONTAGE-FF-7D-03",
        game: "FreeFire",
        duration: "7d",
        status: "active",
        hwid: "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
        max_devices: 1,
        created_at: pastStr(3),
        first_used_at: pastStr(3),
        expires_at: dateStr(4),
        paused_at: null,
        remaining_seconds_on_pause: 0,
        reset_count: 0,
        last_reset_at: null,
        created_by: "reseller_alex",
        notes: "Buyer 3"
      },
      {
        id: "MONTAGE-FF-1D-04",
        user_key: "MONTAGE-FF-1D-04",
        game: "FreeFire",
        duration: "1d",
        status: "active",
        hwid: "12345678-abcd-ef01-2345-6789abcdef01",
        max_devices: 1,
        created_at: pastStr(0.5),
        first_used_at: pastStr(0.5),
        expires_at: dateStr(0.5),
        paused_at: null,
        remaining_seconds_on_pause: 0,
        reset_count: 0,
        last_reset_at: null,
        created_by: "reseller_alex",
        notes: "Trial"
      },
      {
        id: "MONTAGE-FF-NEW-05",
        user_key: "MONTAGE-FF-NEW-05",
        game: "FreeFire",
        duration: "7d",
        status: "unused",
        hwid: null,
        max_devices: 1,
        created_at: pastStr(1),
        first_used_at: null,
        expires_at: null,
        paused_at: null,
        remaining_seconds_on_pause: 0,
        reset_count: 0,
        last_reset_at: null,
        created_by: "admin",
        notes: "Stock inventory"
      }
    ],
    activity_logs: [
      {
        id: "act_259",
        ticket_id: 259,
        game: "FreeFire",
        duration: "7 Days",
        devices: "1 Device(s)",
        action: "Client Auth Handshake",
        status: "success",
        timestamp: pastStr(0.1)
      },
      {
        id: "act_258",
        ticket_id: 258,
        game: "FreeFire",
        duration: "1 Day",
        devices: "1 Device(s)",
        action: "Client Auth Handshake",
        status: "success",
        timestamp: pastStr(0.4)
      },
      {
        id: "act_257",
        ticket_id: 257,
        game: "FreeFire",
        duration: "1 Day",
        devices: "2 Device(s)",
        action: "HWID Bound",
        status: "success",
        timestamp: pastStr(1.2)
      },
      {
        id: "act_256",
        ticket_id: 256,
        game: "FreeFire",
        duration: "30 Days",
        devices: "1 Device(s)",
        action: "Key Generated",
        status: "success",
        timestamp: pastStr(2.5)
      }
    ],
    next_ticket_id: 260
  };
}

let localCache = null;

function loadLocalData() {
  if (localCache) return localCache;
  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialData();
    saveLocalData(initial);
    localCache = initial;
    return localCache;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    localCache = JSON.parse(raw);
    return localCache;
  } catch (err) {
    console.error('Error reading database.json, initializing fresh data:', err);
    localCache = getInitialData();
    saveLocalData(localCache);
    return localCache;
  }
}

function saveLocalData(data) {
  localCache = data;
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function checkExpirations(keys) {
  const now = new Date();
  let modified = false;
  for (const k of keys) {
    if (k.status === 'active' && k.expires_at) {
      if (new Date(k.expires_at) <= now) {
        k.status = 'expired';
        modified = true;
      }
    }
  }
  return modified;
}

export const db = {
  // SETTINGS
  async getSettings() {
    const firestore = getFirestore();
    if (firestore) {
      try {
        const doc = await firestore.collection('system').doc('settings').get();
        if (doc.exists) return doc.data();
        const initial = loadLocalData().settings;
        await firestore.collection('system').doc('settings').set(initial);
        return initial;
      } catch (err) {
        // Fallback to local
      }
    }
    const data = loadLocalData();
    return data.settings;
  },

  async updateSettings(updates) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('system').doc('settings').set(updates, { merge: true });
      } catch (err) {}
    }
    const data = loadLocalData();
    data.settings = { ...data.settings, ...updates };
    saveLocalData(data);
    return data.settings;
  },

  // KEYS
  async getKeys(filter = {}) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        let query = firestore.collection('keys');
        if (filter.created_by) query = query.where('created_by', '==', filter.created_by);
        const snapshot = await query.get();
        if (!snapshot.empty) {
          const keys = [];
          snapshot.forEach(doc => keys.push({ id: doc.id, ...doc.data() }));
          return keys;
        }
      } catch (err) {}
    }
    const data = loadLocalData();
    if (checkExpirations(data.keys)) saveLocalData(data);
    let result = data.keys;
    if (filter.created_by) {
      result = result.filter(k => k.created_by === filter.created_by);
    }
    return result;
  },

  async getKey(user_key) {
    if (!user_key) return null;
    const firestore = getFirestore();
    if (firestore) {
      try {
        const doc = await firestore.collection('keys').doc(user_key).get();
        if (doc.exists) return { id: doc.id, ...doc.data() };
      } catch (err) {}
    }
    const data = loadLocalData();
    if (checkExpirations(data.keys)) saveLocalData(data);
    return data.keys.find(k => k.user_key.toLowerCase() === user_key.trim().toLowerCase()) || null;
  },

  async createKey(keyData) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('keys').doc(keyData.user_key).set(keyData);
      } catch (err) {}
    }
    const data = loadLocalData();
    data.keys.unshift(keyData);
    saveLocalData(data);
    return keyData;
  },

  async updateKey(user_key, updates) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('keys').doc(user_key).set(updates, { merge: true });
      } catch (err) {}
    }
    const data = loadLocalData();
    const idx = data.keys.findIndex(k => k.user_key.toLowerCase() === user_key.trim().toLowerCase());
    if (idx !== -1) {
      data.keys[idx] = { ...data.keys[idx], ...updates };
      saveLocalData(data);
      return data.keys[idx];
    }
    return null;
  },

  async deleteKey(user_key) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('keys').doc(user_key).delete();
      } catch (err) {}
    }
    const data = loadLocalData();
    data.keys = data.keys.filter(k => k.user_key.toLowerCase() !== user_key.trim().toLowerCase());
    saveLocalData(data);
    return true;
  },

  // USERS
  async getUsers() {
    const firestore = getFirestore();
    if (firestore) {
      try {
        const snapshot = await firestore.collection('users').get();
        if (!snapshot.empty) {
          const users = [];
          snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
          return users;
        }
      } catch (err) {}
    }
    const data = loadLocalData();
    return data.users;
  },

  async getUserById(id) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        const doc = await firestore.collection('users').doc(id).get();
        if (doc.exists) return { id: doc.id, ...doc.data() };
      } catch (err) {}
    }
    const data = loadLocalData();
    return data.users.find(u => u.id === id) || null;
  },

  async getUserByUsername(username) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        const snapshot = await firestore.collection('users').where('username', '==', username).limit(1).get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {}
    }
    const data = loadLocalData();
    return data.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase()) || null;
  },

  async createUser(userData) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('users').doc(userData.id).set(userData);
      } catch (err) {}
    }
    const data = loadLocalData();
    data.users.push(userData);
    saveLocalData(data);
    return userData;
  },

  async updateUser(id, updates) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('users').doc(id).set(updates, { merge: true });
      } catch (err) {}
    }
    const data = loadLocalData();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...updates };
      saveLocalData(data);
      return data.users[idx];
    }
    return null;
  },

  async deleteUser(id) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('users').doc(id).delete();
      } catch (err) {}
    }
    const data = loadLocalData();
    data.users = data.users.filter(u => u.id !== id);
    saveLocalData(data);
    return true;
  },

  // ACTIVITY LOGS
  async getActivityLogs(limit = 20) {
    const firestore = getFirestore();
    if (firestore) {
      try {
        const snapshot = await firestore.collection('activity_logs').orderBy('timestamp', 'desc').limit(limit).get();
        if (!snapshot.empty) {
          const logs = [];
          snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
          return logs;
        }
      } catch (err) {}
    }
    const data = loadLocalData();
    return (data.activity_logs || []).slice(0, limit);
  },

  async addActivityLog(log) {
    const data = loadLocalData();
    const ticket_id = data.next_ticket_id || 260;
    data.next_ticket_id = ticket_id + 1;

    const newLog = {
      id: "act_" + ticket_id,
      ticket_id: ticket_id,
      game: log.game || "FreeFire",
      duration: log.duration || "N/A",
      devices: log.devices || "1 Device(s)",
      action: log.action || "Activity",
      status: log.status || "success",
      timestamp: new Date().toISOString()
    };

    const firestore = getFirestore();
    if (firestore) {
      try {
        await firestore.collection('activity_logs').doc(newLog.id).set(newLog);
      } catch (err) {}
    }

    if (!data.activity_logs) data.activity_logs = [];
    data.activity_logs.unshift(newLog);
    if (data.activity_logs.length > 100) data.activity_logs = data.activity_logs.slice(0, 100);
    saveLocalData(data);
    return newLog;
  },

  async clearActivityLogs() {
    const firestore = getFirestore();
    if (firestore) {
      try {
        const snapshot = await firestore.collection('activity_logs').get();
        const batch = firestore.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) {}
    }
    const data = loadLocalData();
    data.activity_logs = [];
    saveLocalData(data);
    return true;
  }
};
