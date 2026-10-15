// firebase.js
// Configuración oficial de Firebase para AVASA CHAT

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAQ_k9bVJ3--kFn1DkaagjKAAN3l_Qj6TM',
  authDomain: 'chatavasa.firebaseapp.com',
  databaseURL: 'https://chatavasa-default-rtdb.firebaseio.com',
  projectId: 'chatavasa',
  storageBucket: 'chatavasa.firebasestorage.app',
  messagingSenderId: '859854572760',
  appId: '1:859854572760:android:01ae55dfaf8e7858f41bad',
};

// Inicialización segura (evita re-inicialización en Fast Refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);
