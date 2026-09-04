import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firestoreDb = null;

export function initFirebase() {
  const serviceAccountPath = process.env.FIREBASE_KEY_PATH || path.join(__dirname, 'serviceAccountKey.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
      firestoreDb = admin.firestore();
      console.log('🔥 [Firebase] Successfully connected to Cloud Firestore!');
      return firestoreDb;
    } catch (err) {
      console.warn('⚠️ [Firebase] Failed to initialize from serviceAccountKey.json:', err.message);
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        });
      }
      firestoreDb = admin.firestore();
      console.log('🔥 [Firebase] Connected via environment credentials!');
      return firestoreDb;
    } catch (err) {
      console.warn('⚠️ [Firebase] Failed to initialize from env vars:', err.message);
    }
  } else {
    console.log('⚡ [Database] Firebase credentials not supplied. Using built-in local persistent database engine.');
  }
  return null;
}

export function getFirestore() {
  return firestoreDb;
}
