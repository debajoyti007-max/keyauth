import express from 'express';
import app from './app.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

// Serve frontend in production (for standalone Node / Docker runs)
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

export default app;
