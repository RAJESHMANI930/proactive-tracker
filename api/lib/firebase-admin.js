import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyAcr4dPTqW8LYzCp8D9dnRfda5pVSCF5_8',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'proactive-tracker-9d693.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'proactive-tracker-9d693',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'proactive-tracker-9d693.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '988926796216',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:988926796216:web:a2fe1721b84b45d607af4d',
};

// Avoid re-initializing on serverless warm starts
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
