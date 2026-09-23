# Berozgar Mobile

Native iOS and Android client for the Berozgar social chat experience. This is an Expo SDK 57 React Native app with the same domain boundaries as the web app: auth and sessions, Firestore conversations, WebSocket signaling, tapri rooms, profiles, and P2P media adapters.

## Run locally

```bash
npm install
npx expo start
```

Use Expo Go or a development build to open the app on iOS or Android. The app currently includes an explorable guest path while the shared Firebase client configuration is being connected.

## Architecture

- `App.tsx`: mobile navigation shell and the first native screens for Home, Directory, Tapri, Chats, Profile, and chat detail.
- `src/services/authService.ts`: username-first auth mapping to `{username}@berozgar-app.io`.
- `src/services/chatService.ts`: shared Firestore conversation/message types and collection paths.
- `src/services/signalingService.ts`: native WebSocket boundary for `/api/signal` messages.
- `src/services/sessionService.ts`: guest-session fallback matching the web session contract.
- `src/services/storageService.ts`: AsyncStorage equivalent of the web local/session storage keys.

Before production auth, replace the adapter placeholder in `authService.ts` with the shared Firebase project config and auth persistence. The existing web backend and Firestore collections remain the cross-platform source of truth.
