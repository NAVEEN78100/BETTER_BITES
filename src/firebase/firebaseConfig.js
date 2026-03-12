import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB3LbbvUGtz-8SA006WbQ8k2-IUbMU1MFA",
  authDomain: "better-bites-2e642.firebaseapp.com",
  projectId: "better-bites-2e642",
  storageBucket: "better-bites-2e642.firebasestorage.app",
  messagingSenderId: "320510087117",
  appId: "1:320510087117:web:3b165c71eb46d01964fe84",
  measurementId: "G-PG8F4ZKV1Y"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
