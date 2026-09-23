export type Conversation = {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  updatedAt: number;
  lastMessage?: { text: string; senderName: string; timestamp: number };
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'call_log';
  timestamp: number;
  seenBy: string[];
};

export const conversationPath = (conversationId: string) => `conversations/${conversationId}`;
export const messagesPath = (conversationId: string) => `${conversationPath(conversationId)}/messages`;

export function isMessageUnread(message: Message, currentUserId: string) {
  return message.senderId !== currentUserId && !message.seenBy.includes(currentUserId);
}
