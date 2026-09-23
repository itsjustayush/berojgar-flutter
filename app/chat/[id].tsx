import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { auth } from '../../src/lib/firebase';
import {
  markMessagesAsSeen,
  sendSocialMessage,
  subscribeToConversation,
  subscribeToMessages,
  updateTypingStatus,
  type ChatMessage,
  type Conversation,
} from '../../src/services/chatService';
import { appTheme } from '../../src/theme';

type RouteParams = { id?: string | string[] };

type ReceiptProps = {
  message: ChatMessage;
  currentUserId: string;
};

function Header({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>CONVERSATION</Text>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <View style={styles.headerMark}><Text style={styles.headerMarkText}>चाय</Text></View>
    </View>
  );
}

function Receipt({ message, currentUserId }: ReceiptProps) {
  if (message.senderId !== currentUserId) return null;
  const hasBeenSeen = message.seenBy.some((uid) => uid !== currentUserId);
  const receipt = message.status === 'sent' ? '✓' : '✓✓';
  return <Text style={[styles.receipt, hasBeenSeen && styles.receiptSeen]}>{hasBeenSeen ? '✓✓' : receipt}</Text>;
}

export default function ChatRoute() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<RouteParams>();
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const currentUserId = auth.currentUser?.uid ?? '';
  const currentUserName = auth.currentUser?.displayName ?? 'Guest';
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [typingNow, setTypingNow] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!conversationId) {
      return;
    }
    const unsubscribeConversation = subscribeToConversation(conversationId, setConversation, (snapshotError) => {
      setError(snapshotError.message);
      setLoading(false);
    });
    const unsubscribeMessages = subscribeToMessages(conversationId, (nextMessages) => {
      setMessages(nextMessages);
      setLoading(false);
    }, (snapshotError) => {
      setError(snapshotError.message);
      setLoading(false);
    });
    return () => {
      unsubscribeConversation();
      unsubscribeMessages();
    };
  }, [conversationId]);

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!conversationId || !currentUserId || messages.length === 0) return;
    const unseenIds = messages.filter((message) => message.senderId !== currentUserId && !message.seenBy.includes(currentUserId)).map((message) => message.id);
    if (unseenIds.length > 0) void markMessagesAsSeen(conversationId, unseenIds, currentUserId).catch(() => undefined);
  }, [conversationId, currentUserId, messages]);

  useEffect(() => () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (conversationId && currentUserId && typingNow) void updateTypingStatus(conversationId, currentUserId, false).catch(() => undefined);
  }, [conversationId, currentUserId, typingNow]);

  const remoteTyping = useMemo(() => {
    if (!conversation?.typing || !currentUserId) return false;
    return Object.entries(conversation.typing).some(([uid, timestamp]) => uid !== currentUserId && now - timestamp < 4000);
  }, [conversation, currentUserId, now]);

  const updateDraft = (value: string) => {
    setDraft(value);
    if (!conversationId || !currentUserId) return;
    if (!typingNow) {
      setTypingNow(true);
      void updateTypingStatus(conversationId, currentUserId, true).catch(() => undefined);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTypingNow(false);
      void updateTypingStatus(conversationId, currentUserId, false).catch(() => undefined);
    }, 2500);
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !conversationId || !currentUserId || sending) return;
    setSending(true);
    setError('');
    try {
      await sendSocialMessage({ conversationId, senderId: currentUserId, senderName: currentUserName, text, type: 'text' });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDraft('');
      setTypingNow(false);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      await updateTypingStatus(conversationId, currentUserId, false);
      requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const title = conversation?.type === 'group' ? 'Tapri lounge' : 'Direct message';
  const subtitle = remoteTyping ? 'Someone is typing...' : conversation?.type === 'group' ? 'Live room' : 'Messages sync across devices';

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Header title={title} subtitle={subtitle} onBack={() => router.back()} />
        {!conversationId || error ? <View style={styles.state}><Text style={styles.stateTitle}>{error || 'Conversation unavailable'}</Text><Text style={styles.stateBody}>Check the conversation ID and your Firebase access, then try again.</Text></View> : loading ? <View style={styles.state}><Text style={styles.stateTitle}>Loading conversation...</Text></View> : <ScrollView ref={scrollViewRef} contentContainerStyle={styles.messages} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}>{messages.length === 0 ? <View style={styles.empty}><Text style={styles.stateTitle}>Start the conversation</Text><Text style={styles.stateBody}>Send the first message and make some room for chai.</Text></View> : messages.map((message) => { const outgoing = message.senderId === currentUserId; return <View key={message.id} style={[styles.message, outgoing ? styles.outgoing : styles.incoming]}><Text style={outgoing ? styles.messageTextLight : styles.messageText}>{message.text}</Text><View style={styles.messageMeta}><Text style={outgoing ? styles.metaLight : styles.meta}>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text><Receipt message={message} currentUserId={currentUserId} /></View></View>; })}</ScrollView>}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.composer}>
          <Pressable accessibilityLabel="Attachments" style={styles.attachButton} onPress={() => setError('Attachments will be enabled with the shared media storage service.')}><Text style={styles.attachText}>＋</Text></Pressable>
          <TextInput value={draft} onChangeText={updateDraft} onBlur={() => { if (conversationId && currentUserId) { setTypingNow(false); void updateTypingStatus(conversationId, currentUserId, false).catch(() => undefined); } }} placeholder="Write a message..." placeholderTextColor={appTheme.colors.muted} style={styles.input} multiline maxLength={2000} />
          <Pressable accessibilityLabel="Send Chai" disabled={!draft.trim() || sending || !currentUserId} style={[styles.sendButton, (!draft.trim() || sending || !currentUserId) && styles.sendDisabled]} onPress={() => void sendMessage()}><Text style={styles.sendText}>☕</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appTheme.colors.background },
  flex: { flex: 1 },
  header: { minHeight: 84, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: appTheme.colors.border },
  backButton: { paddingRight: 12, paddingVertical: 8 },
  backText: { color: appTheme.colors.text, fontSize: 38, lineHeight: 38, fontWeight: '300' },
  headerCopy: { flex: 1 },
  eyebrow: { color: appTheme.colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 3 },
  title: { color: appTheme.colors.text, fontSize: 19, fontWeight: '800' },
  subtitle: { color: appTheme.colors.muted, fontSize: 12, marginTop: 3 },
  headerMark: { width: 42, height: 42, borderRadius: 21, backgroundColor: appTheme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  headerMarkText: { color: '#fff7ed', fontSize: 11, fontWeight: '800' },
  messages: { flexGrow: 1, padding: 18, justifyContent: 'flex-end', gap: 10 },
  message: { maxWidth: '82%', padding: 13, borderRadius: 16 },
  incoming: { alignSelf: 'flex-start', backgroundColor: '#0e172a', borderWidth: 1, borderColor: appTheme.colors.border },
  outgoing: { alignSelf: 'flex-end', backgroundColor: '#ea580c' },
  messageText: { color: appTheme.colors.text, fontSize: 15, lineHeight: 21 },
  messageTextLight: { color: '#fff7ed', fontSize: 15, lineHeight: 21 },
  messageMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 7 },
  meta: { color: appTheme.colors.muted, fontSize: 10 },
  metaLight: { color: '#fed7aa', fontSize: 10 },
  receipt: { color: '#fed7aa', fontSize: 12, fontWeight: '800' },
  receiptSeen: { color: '#ffb54d' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  empty: { alignItems: 'center', padding: 24 },
  stateTitle: { color: appTheme.colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stateBody: { color: appTheme.colors.secondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  errorText: { color: '#e07a5f', paddingHorizontal: 18, paddingBottom: 6, fontSize: 12 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: appTheme.colors.border, gap: 8 },
  attachButton: { width: 42, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#131e36' },
  attachText: { color: appTheme.colors.secondary, fontSize: 25, fontWeight: '300' },
  input: { flex: 1, maxHeight: 110, minHeight: 46, backgroundColor: '#131e36', color: appTheme.colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderRadius: 16 },
  sendButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ea580c', borderRadius: 23 },
  sendDisabled: { opacity: 0.4 },
  sendText: { fontSize: 20 },
});
