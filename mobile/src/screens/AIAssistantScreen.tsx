import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Badge } from '../components/Badge';
import { api } from '../api/client';
import { AssistantMessage } from '../types';
import { Sparkles, Send, Bot, User as UserIcon, HelpCircle } from 'lucide-react-native';

const INITIAL_MESSAGES: AssistantMessage[] = [
  {
    id: '1',
    from: 'assistant',
    content:
      'Bonjour Alexandre ! Je suis votre Assistant IA CampusConnect. J’ai analysé votre emploi du temps, vos devoirs et les annonces récentes du campus. Comment puis-je vous aider aujourd’hui ?',
    timestamp: '08:34',
    suggestions: [
      'Quand est mon prochain cours ?',
      'Quels devoirs dois-je rendre ?',
      'Y a-t-il une alerte pour mon objet perdu ?',
      'Comment déclarer une absence ?',
    ],
  },
];

interface AIAssistantScreenProps {
  onNavigateTab?: (tab: string) => void;
}

export const AIAssistantScreen: React.FC<AIAssistantScreenProps> = ({ onNavigateTab }) => {
  const [messages, setMessages] = useState<AssistantMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q) return;

    const userMsg: AssistantMessage = {
      id: Date.now().toString(),
      from: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Appel au backend FastAPI /assistant/question
      const resp = await api.askAssistant(q);
      const aiReply: AssistantMessage = {
        id: (Date.now() + 1).toString(),
        from: 'assistant',
        content: resp.reponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch {
      // Réponses intelligentes intégrées de secours (offline / fallback)
      setTimeout(() => {
        let answer = 'Je consulte les données officielles de CampusConnect.';
        const lower = q.toLowerCase();

        if (lower.includes('prochain cours') || lower.includes('salle') || lower.includes('cours')) {
          answer =
            'Votre prochain cours est : Intelligence Artificielle & Réseaux de Neurones à 10:00 en Amphi Alan Turing (Bâtiment C, 2e étage) avec Prof. Jean-Marc Lecoq.\n\nAttention : votre cours de Compilation de 14:00 est déplacé en Salle B2.';
        } else if (lower.includes('devoir') || lower.includes('examen') || lower.includes('rendre')) {
          answer =
            'Vous avez 2 échéances prioritaires :\n• Rendu de Projet Analyseur Lexical : Demain à 23:59 (Binôme)\n• Évaluation NoSQL : Jeudi 17 Avril de 14:00 à 16:00 en Amphi Turing.';
        } else if (lower.includes('perdu') || lower.includes('trouvé') || lower.includes('clé')) {
          answer =
            'Une correspondance potentielle à 88% a été détectée pour votre déclaration : une clé USB SanDisk 64Go a été trouvée ce matin au Foyer Turing.';
        } else if (lower.includes('absence')) {
          answer =
            'Vous pouvez déclarer une absence directement depuis l’onglet dédié ou les actions rapides. L’IA peut vous assister dans la rédaction du motif médical ou administratif.';
        } else {
          answer =
            'J’ai bien pris en compte votre question. En tant qu’assistant officiel CampusConnect, je veille à la conformité de vos informations universitaires. N’hésitez pas à me demander des détails sur vos cours, devoirs ou démarches.';
        }

        const fallbackReply: AssistantMessage = {
          id: (Date.now() + 1).toString(),
          from: 'assistant',
          content: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackReply]);
        setLoading(false);
      }, 600);
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header Info */}
      <View style={styles.topInfoBar}>
        <View style={styles.assistantAvatar}>
          <Sparkles size={16} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.assistantTitle}>Assistant IA CampusConnect</Text>
          <Text style={styles.assistantStatus}>
            ● Connecté aux données officielles de votre classe
          </Text>
        </View>
        <Badge label="GPT-4o / Fast" tone="purple" size="sm" />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => {
          const isMe = m.from === 'user';
          return (
            <View key={m.id} style={[styles.bubbleWrapper, isMe ? styles.bubbleMe : styles.bubbleAi]}>
              {!isMe && (
                <View style={styles.avatarMini}>
                  <Bot size={14} color={Colors.primary} />
                </View>
              )}

              <View style={[styles.bubble, isMe ? styles.bubbleContentMe : styles.bubbleContentAi]}>
                <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextAi]}>
                  {m.content}
                </Text>
                <Text style={[styles.bubbleTime, isMe ? styles.timeMe : styles.timeAi]}>
                  {m.timestamp}
                </Text>

                {m.suggestions && m.suggestions.length > 0 && (
                  <View style={styles.suggestionsBox}>
                    <Text style={styles.suggestionsHeader}>Questions fréquentes :</Text>
                    {m.suggestions.map((s, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.suggestionPill}
                        onPress={() => sendMessage(s)}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={[styles.bubbleWrapper, styles.bubbleAi]}>
            <View style={styles.avatarMini}>
              <Bot size={14} color={Colors.primary} />
            </View>
            <View style={[styles.bubble, styles.bubbleContentAi, { flexDirection: 'row', gap: 6, alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>L'IA réfléchit...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Posez une question à l’IA Campus..."
          placeholderTextColor={Colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Send size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgLight,
  },
  topInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  assistantStatus: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '700',
    marginTop: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '86%',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    gap: 8,
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    borderRadius: 16,
    padding: 12,
  },
  bubbleContentMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleContentAi: {
    backgroundColor: Colors.bgSurface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextMe: {
    color: '#FFF',
  },
  bubbleTextAi: {
    color: Colors.textDark,
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timeAi: {
    color: Colors.textMuted,
  },
  suggestionsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  suggestionsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  suggestionPill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textDark,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
