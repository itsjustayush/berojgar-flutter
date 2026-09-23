# AGENTS.md — Master Architecture & AI Coding Guidelines for Berozgar (बेरोजगार)

You are acting as a Senior React Native & Systems Architect helping build and maintain the native iOS and Android client for **Berozgar**, a real-time social platform and chat application. 

The mobile application must strictly mirror the architecture, data models, state synchronization, and visual design system of our existing production web application (hosted on Vercel), ensuring seamless cross-platform parity.

---

## 1. Tech Stack & Environment
- **Framework:** React Native with Expo (TypeScript, Strict Mode)
- **Styling:** React Native `StyleSheet` / NativeWind using the custom **Terracotta & Chai** design token system.
- **Backend & Cloud Persistence:** Google Cloud Firestore (Instance: `ai-studio-ultronchat-6f086b67-bf2a-4efa-9abb-b35fc63cf7b9`, Region: `asia-southeast1`)
- **Authentication:** Firebase Auth with secure React Native `AsyncStorage` token persistence.
- **Real-Time Signaling & WebSockets:** Node.js/Express WebSocket gateway mounted at `/api/signal`.
- **Media & Calling:** WebRTC peer-to-peer audio/video calling with STUN relay pools.

---

## 2. Design System & UI Guidelines ("Terracotta & Chai" Constitution)
When writing components, strictly adhere to these visual tokens and geometry rules to match the web landing page and dashboard:

### A. Color Palette Tokens
| Token Category | Dark Mode Value | Light Mode Value | UI Application |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | `#DAE2FF` | `#020D29` | Main brand headings, badges, primary buttons |
| **Primary Container** | `#1E293B` | `#18233F` | Logo backgrounds, active high-contrast pills |
| **Chai Amber (Secondary)** | `#FFB54D` | `#845400` | Accent icons, Chai clink triggers, timestamps |
| **Secondary Container** | `#6D3F00` | `#FFB54D` | Chat seen checkmarks (`CheckCheck`), Chai badges |
| **Surface Canvas** | `#0B1120` | `#F9F9FF` | Base app background scaffold |
| **Surface Container Lowest**| `#0E172A` | `#FFFFFF` | Primary cards, chat message bubbles, dialog panels |
| **Surface Container Low** | `#131E36` | `#F1F3FF` | Secondary input boxes, search fields |
| **Outline Variant** | `#3A455A` | `#C6C6CE` | Subtle dividers, card outlines (`border-outline-variant/30`) |

### B. Shape & Elevation Geometry
- **Pill Elements (`border-radius: 9999px`):** Primary/secondary action buttons ("Send 1 Chai"), navigation tabs, status chips, verified badges.
- **Cards & Hero Surfaces (`border-radius: 24px / rounded-3xl`):** Modal cards, profile hero containers, lounge cards.
- **Input Fields & Bubbles (`border-radius: 16px / rounded-2xl`):** Text input containers, incoming/outgoing chat message bubbles.

---

## 3. Cloud Storage & Firestore Schema Architecture
The mobile app shares the exact same Firestore collections as the web application to guarantee instant cross-platform sync:

- **`/users/{userId}`**: Stores profile metadata (`uid`, `username`, `displayName`, `photoURL`, `bio`, `status` ['online'|'offline'], `lastSeen`, `chaiCount`, `customThemeAura`, `timezone`, `city`).
- **`/usernames/{username}`**: Atomic uniqueness lock storing `{ uid, createdAt }` to prevent handle collision.
- **`/conversations/{conversationId}`**: Stores active 1:1 DMs (`dm_{uid1}_{uid2}`) or group Tapri lounges (`tapri_{name}`), participants array, `lastMessage` preview snippet, and ephemeral `typing` maps.
- **`/conversations/{conversationId}/messages/{messageId}`**: Threaded message documents containing `senderId`, `text`, `type` ('text' | 'image' | 'voice' | 'call_log'), `status` ('sent' | 'delivered' | 'read'), `seenBy` array, `readAt` timestamps, and emoji `reactions`.
- **`/calls/{callId}`**: WebRTC call signaling sessions managing offer/answer SDP blobs and ICE candidate arrays.

---

## 4. Authentication & Handle Mapping Lifecycle
Berozgar uses an Instagram-style username handle system mapped securely on top of Firebase Authentication:
1. **Handle Sanitization:** Usernames are sanitized to lowercase alphanumeric characters and underscores (`/^[a-zA-Z0-9_]{3,30}$/`).
2. **Deterministic Email Mapping:** Because Firebase Auth requires an email format, handles are mapped internally:
   $$\text{email} = \text{cleanUsername} + \text{@berozgar-app.io}$$
3. **Session Persistence:** Login invokes `signInWithEmailAndPassword` using the mapped email, storing the RS256-signed JWT ID token in React Native `AsyncStorage`.

---

## 5. Real-Time Synchronization Workflows
- **Live Listeners (`onSnapshot`):** Active chat screens subscribe in real-time to `/conversations/{convId}/messages` ordered chronologically.
- **Typing Indicators:** Keystrokes write `typing[uid] = Date.now()` to the conversation document with a 2.5-second client debounce and a 4-second auto-expiry check (`Date.now() - timestamp < 4000`).
- **Read Receipts:** Opening a conversation triggers `markMessagesAsSeen`, appending the user's UID to `seenBy` and logging `readAt[uid]`, updating checkmarks from single grey to double Chai accent.

---

## 6. Rules for AI Assistants (Copilot / Cursor)
1. **Never Introduce Mismatched Schemas:** Always preserve Firestore collection paths, field names, and data types (`userId`, `conversationId`, `chaiCount`, etc.) so the web and mobile clients remain fully synchronized.
2. **Honor the Design System:** Never use generic system blue or standard UI components when custom Terracotta & Chai styling tokens are specified.
3. **TypeScript Strictness:** Write fully typed React Native components. Avoid `any` types for message models, user profiles, or navigation props.