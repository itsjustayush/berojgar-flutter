# Berozgar Mobile

Native iOS and Android client for the Berozgar social chat experience. This is an Expo SDK 57 React Native app with the same domain boundaries as the web app: auth and sessions, Firestore conversations, WebSocket signaling, tapri rooms, profiles, and P2P media adapters.

## Run locally

```bash
npm install
npx expo start
```

Use Expo Go or a development build to open the app on iOS or Android. The app includes an explorable guest path, while authenticated chat uses the shared Firebase project.

## Architecture

- `app/_layout.tsx`: Expo Router stack entry.
- `app/index.tsx`: existing Berozgar shell entry.
- `app/chat/[id].tsx`: live Firestore chat route with receipts, typing presence, and Send Chai haptics.
- `App.tsx`: mobile presentation for Home, Directory, Tapri, Chats, and Profile.
- `src/lib/firebase.ts`: Firebase Auth persistence and the named Firestore database connection.
- `src/services/authService.ts`: username-first Auth mapping to `{username}@berozgar-app.io`.
- `src/services/chatService.ts`: typed Firestore listeners, message writes, typing state, and read receipts.
- `src/services/signalingService.ts`: native WebSocket boundary for `/api/signal` messages.
- `src/services/sessionService.ts`: guest-session fallback matching the web session contract.
- `src/services/storageService.ts`: AsyncStorage equivalent of the web local/session storage keys.

The existing web backend and Firestore collections remain the cross-platform source of truth. Attachments, WebRTC calls, and P2P chunk transfers remain separate native development-build work; the chat route currently exposes an attachment affordance without pretending to upload binary data.
