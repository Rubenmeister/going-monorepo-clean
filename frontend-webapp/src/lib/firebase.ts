import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || 'AIzaSyA0HE8V7Z_9JTjikcQ08ud_p3jx1GJAeEU',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'going-5d1ae.firebaseapp.com',
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL       || 'https://going-5d1ae-default-rtdb.firebaseio.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || 'going-5d1ae',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'going-5d1ae.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '780842550857',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || '',
};

// Evitar inicialización duplicada en Next.js (hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export default app;
