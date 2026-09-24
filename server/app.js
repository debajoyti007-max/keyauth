import express from 'express';
import cors from 'cors';
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

// Initialize Firebase (or fall back to local database)
initFirebase();

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Accept application/x-www-form-urlencoded and json
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Request logging in development
app.use((req, res, next) => {
  if (req.path === '/connect' || req.path === '/' || req.path === '/api/connect') {
    console.log('📡 [C++ Handshake] ' + req.method + ' ' + req.path + ' from ' + req.ip + ' - Game: ' + (req.body.game || req.query.game || 'FreeFire'));
  }
  next();
});

// REST API routes
app.use('/api/auth', authRouter);
app.use('/api/keys', keysRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/public', publicResetRouter);

// C++ Client Handshake routes (matches /connect, /api/connect, /api, /)
app.use('/connect', connectRouter);
app.use('/api/connect', connectRouter);
app.use('/api', connectRouter);
app.use('/', connectRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MONTAGE CORPORATION Control Panel & License Auth Engine',
    timestamp: new Date().toISOString()
  });
});

export default app;
