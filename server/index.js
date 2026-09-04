import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initFirebase } from './firebase.js';

import connectRouter from './routes/connect.js';
import authRouter from './routes/auth.js';
import keysRouter from './routes/keys.js';
import usersRouter from './routes/users.js';
import settingsRouter from './routes/settings.js';
import statsRouter from './routes/stats.js';
import publicResetRouter from './routes/publicReset.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase (or fall back to local database)
initFirebase();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Crucial: accept application/x-www-form-urlencoded for the raw C++ client request!
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Request logging in development
app.use((req, res, next) => {
  if (req.path === '/connect') {
    console.log('📡 [C++ Handshake] ' + req.method + ' /connect from ' + req.ip + ' - Game: ' + (req.body.game || req.query.game || 'FreeFire'));
  }
  next();
});

// C++ Client Handshake route (direct root and /api)
app.use('/', connectRouter);
app.use('/api', connectRouter);

// REST API routes
app.use('/api/auth', authRouter);
app.use('/api/keys', keysRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/public', publicResetRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MONTAGE CORPORATION Control Panel & License Auth Engine',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/connect') {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log('====================================================');
  console.log('👑 MONTAGE CORPORATION - License Authentication Engine');
  console.log('🚀 Server listening on: http://localhost:' + PORT);
  console.log('🔌 C++ Handshake endpoint: http://localhost:' + PORT + '/connect');
  console.log('====================================================');
});
