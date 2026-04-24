import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBCq6bC3cZ950JyZ1BJ8CF6UMrUY1hX-go",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dshop-7d123.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dshop-7d123",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dshop-7d123.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "541579454855",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:541579454855:web:9949b1f3be9151b1d24b22"
};

const app = initializeApp(firebaseConfig);

// 🔥 AUTH
export const auth = getAuth(app);

// 🔥 FIX GIỮ ĐĂNG NHẬP (QUAN TRỌNG)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Auth persistence enabled");
  })
  .catch((err) => {
    console.log("Persistence error:", err);
  });

// FIREBASE SERVICES
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
