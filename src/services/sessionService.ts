import { storageKeys, storageService } from './storageService';

export type GuestSession = {
  id: string;
  identifier: string;
  authenticated: false;
  nodeType: 'guest';
  encryptionAlgorithm: 'none';
};

export async function getOrCreateGuestSession(): Promise<GuestSession> {
  const saved = await storageService.get(storageKeys.guestSession);
  if (saved) return JSON.parse(saved) as GuestSession;
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  const session: GuestSession = { id: `guest_${suffix.toLowerCase()}`, identifier: `Guest-${suffix}`, authenticated: false, nodeType: 'guest', encryptionAlgorithm: 'none' };
  await storageService.set(storageKeys.guestSession, JSON.stringify(session));
  return session;
}
