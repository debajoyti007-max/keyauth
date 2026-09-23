import admin from 'firebase-admin';
import { getFirestore as getFirestoreSdk } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firestoreDb = null;
let isFirestoreHealthy = false;

export async function initFirebase() {
  let serviceAccount = null;

  // 1. Direct JSON string or base64 from environment variable (Best for Render / Cloud hosting)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      if (raw.startsWith('{')) {
        serviceAccount = JSON.parse(raw);
      } else {
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decoded);
      }
    } catch (e) {
      console.warn('⚠️ [Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e.message);
    }
  }

  // 2. Secret file from Render (/etc/secrets/...) or custom path or local server directory
  if (!serviceAccount) {
    const renderSecretPath = '/etc/secrets/serviceAccountKey.json';
    const serviceAccountPath = process.env.FIREBASE_KEY_PATH || 
      (fs.existsSync(renderSecretPath) ? renderSecretPath : path.join(__dirname, 'serviceAccountKey.json'));

    if (fs.existsSync(serviceAccountPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      } catch (err) {
        console.warn('⚠️ [Firebase] Failed to parse serviceAccountKey.json:', err.message);
      }
    }
  }

  // 3. Initialize with Service Account object
  if (serviceAccount) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      // Automatically connect to the active Firestore database ('default' or '(default)')
      for (const dbId of ['default', '(default)', undefined]) {
        try {
          const dbInstance = dbId ? getFirestoreSdk(dbId) : getFirestoreSdk();
          await dbInstance.collection('system').limit(1).get();
          firestoreDb = dbInstance;
          isFirestoreHealthy = true;
          console.log(`🔥 [Firebase] Cloud Firestore is ACTIVE & CONNECTED to: ${serviceAccount.project_id} (database: ${dbId || 'default'})!`);
          break;
        } catch (connErr) {
          // try next dbId
        }
      }

      if (!isFirestoreHealthy) {
        console.warn(`⚠️ [Firebase] Could not reach Firestore instance yet for ${serviceAccount.project_id}. Using local database fallback.`);
      }

      return firestoreDb;
    } catch (err) {
      console.warn('⚠️ [Firebase] Initialization failed:', err.message);
    }
  } 
  
  // 4. Individual environment credentials
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
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
      for (const dbId of ['default', '(default)', undefined]) {
        try {
          const dbInstance = dbId ? getFirestoreSdk(dbId) : getFirestoreSdk();
          await dbInstance.collection('system').limit(1).get();
          firestoreDb = dbInstance;
          isFirestoreHealthy = true;
          console.log(`🔥 [Firebase] Cloud Firestore is ACTIVE & CONNECTED via env vars!`);
          break;
        } catch (e) {}
      }
      return firestoreDb;
    } catch (err) {
      console.warn('⚠️ [Firebase] Failed to initialize from env vars:', err.message);
    }
  }

  console.log('⚡ [Database] Using built-in local persistent database engine.');
  return null;
}

export function getFirestore() {
  if (isFirestoreHealthy) return firestoreDb;
  return null;
}

export function setFirestoreHealthy(status) {
  isFirestoreHealthy = status;
}
