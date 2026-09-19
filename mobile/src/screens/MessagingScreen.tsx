import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '../data/mockData';
import { Conversation, ChatMessage } from '../types';
import {
  MessageSquare,
  Send,
  Users,
  User as UserIcon,
  ArrowLeft,
  Search,
} from 'lucide-react-native';

export const MessagingScreen: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES[1] || []);
  const [inputText, setInputText] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      if (data && data.length > 0) setConversations(data);
    } catch {}
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    try {
      const msgs = await api.getMessages(conv.id);
      if (msgs && msgs.length > 0) setMessages(msgs);
      else setMessages(MOCK_MESSAGES[conv.id] || []);
    } catch {
      setMessages(MOCK_MESSAGES[conv.id] || []);
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeConv) return;

    const newMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: activeConv.id,
      sender_id: 3,
      content: text,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      is_me: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    try {
      await api.sendMessage(activeConv.id, text);
    } catch {
      // Local addition already done
    }
  };

  if (activeConv) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveConv(null)}>
            <ArrowLeft size={20} color={Colors.textDark} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.chatHeaderTitle}>{activeConv.title}</Text>
            <Text style={styles.chatHeaderSub}>
              {activeConv.is_group ? 'Groupe de promotion' : 'Enseignant référent'}
            </Text>
          </View>
        </View>

        {/* Message Thread */}
        <ScrollView contentContainerStyle={styles.chatThread} showsVerticalScrollIndicator={false}>
          {messages.map((m) => {
            const isMe = m.is_me || m.sender_id === 3;
            return (
              <View
                key={m.id}
                style={[styles.msgWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther]}
              >
                <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                  <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
                    {m.content}
                  </Text>
                  <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
                    {m.created_at}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.chatInput}
            placeholder="Écrivez votre message..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadConversations} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Messagerie & Canaux ({conversations.length})</Text>

        {conversations.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            style={styles.convCard}
            onPress={() => openConversation(conv)}
            activeOpacity={0.8}
          >
            <View style={styles.convIcon}>
              {conv.is_group ? (
                <Users size={20} color={Colors.primary} />
              ) : (
                <UserIcon size={20} color={Colors.primary} />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.convTopRow}>
                <Text style={styles.convTitle}>{conv.title}</Text>
                <Text style={styles.convTime}>{conv.last_message_date}</Text>
              </View>
              <Text style={styles.lastMsg} numberOfLines={1}>
                {conv.last_message}
              </Text>
            </View>

            {conv.unread_count ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{conv.unread_count}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 12,
  },
  convIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  convTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  convTime: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  lastMsg: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textDark,
  },
  chatHeaderSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  chatThread: {
    padding: 16,
    gap: 10,
  },
  msgWrapper: {
    maxWidth: '80%',
  },
  msgWrapperMe: {
    alignSelf: 'flex-end',
  },
  msgWrapperOther: {
    alignSelf: 'flex-start',
  },
  msgBubble: {
    borderRadius: 14,
    padding: 10,
  },
  msgBubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  msgBubbleOther: {
    backgroundColor: Colors.bgSurface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextMe: {
    color: '#FFF',
  },
  msgTextOther: {
    color: Colors.textDark,
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  msgTimeOther: {
    color: Colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: Colors.textDark,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
