import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChats } from '../context/ChatContext';

export default function ChatScreen({ route, navigation }) {
  const { conversacionId, destinatario } = route.params;
  const { currentUser } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeMessages, loadMessages, sendChatMessage, setActiveMessages } = useChats();

  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  const otherUser = destinatario || {};
  const displayName = otherUser.nombre || otherUser.username || 'Chat';
  const isOnline = otherUser.estado === 'activo';
  const avatarUrl =
    otherUser.avatar ||
    `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(otherUser.correo || displayName)}`;

  // Auto-scroll al abrir el teclado
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => sub.remove();
  }, []);

  // Carga inicial y sondeo periódico para sincronización en tiempo real
  useEffect(() => {
    if (!conversacionId) return;

    loadMessages(conversacionId);

    // Polling cada 3 segundos para traer nuevos mensajes
    const interval = setInterval(() => {
      loadMessages(conversacionId);
    }, 3000);

    return () => clearInterval(interval);
  }, [conversacionId]);

  // Scroll automático cuando lleguen nuevos mensajes
  useEffect(() => {
    if (activeMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [activeMessages.length]);

  const handleSendMessage = async () => {
    if (!text.trim() || isSending) return;

    const messageText = text.trim();
    setText('');
    setIsSending(true);

    try {
      await sendChatMessage(conversacionId, messageText);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const senderId = item.remitente?._id || item.remitente;
    const isMe = senderId === currentUser?.id;

    const timeString = item.fechaCreacion
      ? new Date(item.fechaCreacion).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        {!isMe && (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.senderAvatar}
          />
        )}

        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: colors.accent }]
              : [styles.bubbleOther, { backgroundColor: colors.card, borderColor: colors.border }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMe ? '#ffffff' : colors.textPrimary },
            ]}
          >
            {item.texto}
          </Text>

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                { color: isMe ? 'rgba(255, 255, 255, 0.7)' : colors.textMuted },
              ]}
            >
              {timeString}
            </Text>
            {isMe && (
              <Ionicons
                name={item.leido ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.leido ? '#93c5fd' : 'rgba(255, 255, 255, 0.7)'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
        },
      ]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Cabecera del chat */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerAvatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
          <View
            style={[
              styles.headerStatusDot,
              { backgroundColor: isOnline ? '#22c55e' : '#94a3b8' },
            ]}
          />
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.headerSubtitle, { color: isOnline ? '#16a34a' : colors.textMuted }]}>
            {isOnline ? 'En línea' : 'Desconectado'}
          </Text>
        </View>
      </View>

      {/* Lista de mensajes */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={activeMessages}
          keyExtractor={(item) => item._id || String(item.fechaCreacion)}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Inicia la conversación enviando un mensaje a {displayName}.
              </Text>
            </View>
          }
        />

        {/* Barra de entrada de texto */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 8) + 4,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: text.trim() ? colors.accent : colors.surface,
                opacity: text.trim() ? 1 : 0.6,
              },
            ]}
            onPress={handleSendMessage}
            disabled={!text.trim() || isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons
                name="send"
                size={18}
                color={text.trim() ? '#ffffff' : colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 10,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#cbd5e1',
  },
  headerStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: '#cbd5e1',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    maxHeight: 100,
    marginRight: 8,
  },
  input: {
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
