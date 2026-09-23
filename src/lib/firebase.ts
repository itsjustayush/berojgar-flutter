// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { getAuth, initializeAuth } = FirebaseAuth;
// Firebase selects this React Native export through Metro's conditional resolver.
// @ts-expect-error The Node-oriented resolver omits this conditional symbol.
// eslint-disable-next-line import/namespace
const getReactNativePersistence = FirebaseAuth.getReactNativePersistence;

// Your web/app Firebase configuration
export const firebaseConfig = {
  apiKey: 'AIzaSyCzA7c0tJsLKEu45c4KHVY2japOk47FCJg',
  authDomain: 'itsjustayush-proj.firebaseapp.com',
  projectId: 'itsjustayush-proj',
  storageBucket: 'itsjustayush-proj.firebasestorage.app',
  messagingSenderId: '60708280305',
  appId: '1:60708280305:web:88876836e8ce9a017e5650',
  firestoreDatabaseId: 'ai-studio-ultronchat-6f086b67-bf2a-4efa-9abb-b35fc63cf7b9',
};

// Initialize Firebase (preventing duplicate initialization on hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native AsyncStorage persistence so user stays logged in
export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
})();

// Initialize Firestore pointing to your shared database instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default app;