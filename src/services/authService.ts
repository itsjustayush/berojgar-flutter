import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

export type MobileUser = User;

export type UserProfile = {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  status: 'online' | 'offline';
  lastSeen: number;
  createdAt: number;
  customLocation: string;
  timezone: string;
  city: string;
  countryCode: string;
  chaiCount?: number;
};

export const sanitizeUsername = (handle: string) => handle.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');

export function toSyntheticEmail(handle: string) {
  return `${sanitizeUsername(handle)}@berozgar-app.io`;
}

export async function registerWithUsername(username: string, password: string, displayName: string) {
  const clean = sanitizeUsername(username);
  if (!/^[a-z0-9_]{3,30}$/.test(clean)) throw new Error('Username must be between 3 and 30 characters.');
  const usernameRef = doc(db, 'usernames', clean);
  if ((await getDoc(usernameRef)).exists()) throw new Error('Username is already taken.');

  const createdAt = Date.now();
  const credentials = await createUserWithEmailAndPassword(auth, toSyntheticEmail(clean), password);
  await updateProfile(credentials.user, { displayName });
  await setDoc(usernameRef, { uid: credentials.user.uid, createdAt });
  await setDoc(doc(db, 'users', credentials.user.uid), {
    uid: credentials.user.uid,
    username: clean,
    displayName,
    status: 'online',
    lastSeen: createdAt,
    createdAt,
    customLocation: 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    city: 'Unknown',
    countryCode: 'XX',
    chaiCount: 0,
  } satisfies UserProfile);
  return credentials.user;
}

export async function loginWithHandleOrEmail(identifier: string, password: string) {
  const input = identifier.trim();
  const email = input.includes('@') && !input.startsWith('@') ? input : toSyntheticEmail(input);
  const credentials = await signInWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', credentials.user.uid), { status: 'online', lastSeen: Date.now() }, { merge: true });
  return credentials.user;
}

export const signInWithHandle = loginWithHandleOrEmail;

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function logoutUser() {
  if (auth.currentUser) {
    await setDoc(doc(db, 'users', auth.currentUser.uid), { status: 'offline', lastSeen: Date.now() }, { merge: true });
  }
  await signOut(auth);
}
