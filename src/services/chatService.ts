import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';

import { db } from '../lib/firebase';

export type Conversation = {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  updatedAt: number;
  lastMessage?: { text: string; senderId: string; senderName: string; timestamp: number; type: ChatMessage['type'] };
  typing?: Record<string, number>;
  pinnedBy?: string[];
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'call_log';
  timestamp: number;
  mediaUrl?: string;
  fileMeta?: { name?: string; size?: number; mimeType?: string; duration?: number };
  status: 'sent' | 'delivered' | 'read';
  seenBy: string[];
  readAt?: Record<string, number>;
  reactions?: Record<string, string[]>;
  replyTo?: { id: string; text: string; senderName: string };
};

export type Message = ChatMessage & { id: string };

export type NewMessage = Omit<ChatMessage, 'id' | 'status' | 'seenBy' | 'readAt' | 'reactions' | 'timestamp'>;

export const conversationPath = (conversationId: string) => `conversations/${conversationId}`;
export const messagesPath = (conversationId: string) => `${conversationPath(conversationId)}/messages`;

export function subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void, onError?: (error: Error) => void): Unsubscribe {
  const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
  return onSnapshot(messagesQuery, (snapshot) => {
    callback(snapshot.docs.map((messageDoc) => ({ id: messageDoc.id, ...messageDoc.data() } as Message)));
  }, onError);
}

export async function sendSocialMessage(data: NewMessage) {
  const timestamp = Date.now();
  const message = {
    ...data,
    type: data.type ?? 'text',
    mediaUrl: data.mediaUrl ?? null,
    fileMeta: data.fileMeta ?? null,
    status: 'delivered' as const,
    seenBy: [data.senderId],
    readAt: { [data.senderId]: timestamp },
    reactions: {},
    replyTo: data.replyTo ?? null,
    timestamp,
  };
  const messageRef = await addDoc(collection(db, 'conversations', data.conversationId, 'messages'), message);
  await updateDoc(doc(db, 'conversations', data.conversationId), {
    updatedAt: timestamp,
    lastMessage: { text: data.text, senderId: data.senderId, senderName: data.senderName, timestamp, type: message.type },
  });
  return messageRef.id;
}

export async function markMessagesAsSeen(conversationId: string, messageIds: string[], uid: string) {
  const readAt = Date.now();
  await Promise.all(messageIds.map((messageId) => updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
    seenBy: arrayUnion(uid),
    [`readAt.${uid}`]: readAt,
    status: 'read',
  })));
}

export async function updateTypingStatus(conversationId: string, uid: string, isTyping: boolean) {
  await updateDoc(doc(db, 'conversations', conversationId), { [`typing.${uid}`]: isTyping ? Date.now() : 0 });
}

export function subscribeToConversation(conversationId: string, callback: (conversation: Conversation | null) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(doc(db, 'conversations', conversationId), (snapshot) => {
    callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Conversation) : null);
  }, onError);
}

export function isMessageUnread(message: Message, currentUserId: string) {
  return message.senderId !== currentUserId && !message.seenBy.includes(currentUserId);
}
