import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let firestoreDb = null;
let isFirestoreHealthy = false;

export async function initFirebase() {
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

      // Test whether Firestore Database is created and active
      try {
        await firestoreDb.collection('system').limit(1).get();
        isFirestoreHealthy = true;
        console.log(`🔥 [Firebase] Cloud Firestore is ACTIVE & CONNECTED to project: ${serviceAccount.project_id}!`);
      } catch (checkErr) {
        isFirestoreHealthy = false;
        if (checkErr.message && checkErr.message.includes('not been used in project')) {
          console.log('\n======================================================');
          console.warn('⚠️  [Firebase Action Required]');
          console.warn(`Firestore Database has not been created yet for project: ${serviceAccount.project_id}`);
          console.warn(`👉 Visit: https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore`);
          console.warn('Click "Create database" -> choose a location (e.g. asia-south1 or nam5) -> Start in test mode.');
          console.warn('⚡ Using instant local database in the meantime - zero downtime!');
          console.log('======================================================\n');
        } else {
          console.warn('⚠️  [Firebase Notice]:', checkErr.message);
        }
      }
      return firestoreDb;
    } catch (err) {
      console.warn('⚠️ [Firebase] Failed to parse serviceAccountKey.json:', err.message);
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
      isFirestoreHealthy = true;
      console.log('🔥 [Firebase] Connected via environment credentials!');
      return firestoreDb;
    } catch (err) {
      console.warn('⚠️ [Firebase] Failed to initialize from env vars:', err.message);
    }
  } else {
    console.log('⚡ [Database] Using built-in local persistent database engine.');
  }
  return null;
}

export function getFirestore() {
  if (isFirestoreHealthy) return firestoreDb;
  return null;
}

export function setFirestoreHealthy(status) {
  isFirestoreHealthy = status;
}
