import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD8UoO7uC7QOxJX8vlKlICUL_yN5baDvVY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nishchit-eb118.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nishchit-eb118",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nishchit-eb118.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "562414852235",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:562414852235:web:726efe1823d7d9eb1d1c8e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-948BF43LYD",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://nishchit-eb118-default-rtdb.firebaseio.com"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Auth & Database services
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
