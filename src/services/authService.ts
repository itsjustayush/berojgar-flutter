export type MobileUser = {
  uid: string;
  username: string;
  displayName: string;
};

const normalizeHandle = (handle: string) => handle.trim().replace(/^@/, '').toLowerCase();

export function toSyntheticEmail(handle: string) {
  return `${normalizeHandle(handle)}@berozgar-app.io`;
}

export async function signInWithHandle(handle: string, password: string): Promise<MobileUser> {
  const username = normalizeHandle(handle);
  if (!/^[a-z0-9_]{3,30}$/.test(username)) throw new Error('Invalid username');
  if (password.length < 6) throw new Error('Invalid password');

  // Replace this adapter with Firebase Auth once the shared project config is added.
  throw new Error('Firebase adapter not configured');
}
