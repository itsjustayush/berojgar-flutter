import AsyncStorage from '@react-native-async-storage/async-storage';

export const storageKeys = {
  theme: 'berozgar_theme',
  sidebarCollapsed: 'berozgar_sidebar_collapsed',
  guestSession: 'ultron_chat_guest_session_v1',
} as const;

export const storageService = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
};
