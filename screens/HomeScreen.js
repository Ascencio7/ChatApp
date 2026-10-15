import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChats } from '../context/ChatContext';

export default function HomeScreen({ navigation }) {
  const { currentUser, logout } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    conversations,
    availableUsers,
    isLoadingConversations,
    loadConversations,
    loadAvailableUsers,
    startConversation,
  } = useChats();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    loadConversations();
    loadAvailableUsers();
  }, [loadConversations, loadAvailableUsers]);

  // Confirmación de cerrar sesión
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  // Abrir o crear chat con un usuario
  const handleSelectUser = async (user) => {
    try {
      setIsStartingChat(true);
      const conv = await startConversation(user._id);
      setIsNewChatModalVisible(false);
      setUserSearchQuery('');

      if (conv) {
        navigation.navigate('Chat', {
          conversacionId: conv._id,
          destinatario: user,
        });
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo iniciar la conversación');
    } finally {
      setIsStartingChat(false);
    }
  };

  // Obtener el interlocutor de una conversación
  const getOtherParticipant = (item) => {
    if (!item.participantes || !Array.isArray(item.participantes)) return null;
    return (
      item.participantes.find((p) => (p._id || p) !== currentUser?.id) ||
      item.participantes[0]
    );
  };

  // Filtrado de conversaciones
  const filteredConversations = conversations.filter((c) => {
    const other = getOtherParticipant(c);
    const name = other?.nombre || '';
    const lastMsg = c.ultimoMensaje?.texto || '';
    const q = searchQuery.toLowerCase();
    return name.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
  });

  // Filtrado de usuarios disponibles
  const filteredUsers = availableUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.nombre?.toLowerCase().includes(q) ||
      u.correo?.toLowerCase().includes(q)
    );
  });

  // Renderizar tarjeta de conversación
  const renderConversationItem = ({ item }) => {
    const other = getOtherParticipant(item);
    const displayName = other?.nombre || 'Usuario';
    const isOnline = other?.estado === 'activo';
    const lastMsgText = item.ultimoMensaje?.texto || 'Sin mensajes aún';
    const lastMsgDate = item.ultimoMensaje?.fecha || item.fechaActualizacion || item.fechaCreacion;

    const formattedTime = lastMsgDate
      ? new Date(lastMsgDate).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    const avatarUrl =
      other?.avatar ||
      `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(other?.correo || displayName)}`;

    return (
      <TouchableOpacity
        style={[styles.chatCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('Chat', {
            conversacionId: item._id,
            destinatario: other,
          })
        }
      >
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#22c55e' : '#94a3b8' },
            ]}
          />
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatTitleRow}>
            <Text style={[styles.chatTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.chatTime, { color: colors.textMuted }]}>{formattedTime}</Text>
          </View>
          <Text style={[styles.chatLastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
            {lastMsgText}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
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

      {/* Encabezado */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri:
                currentUser?.avatar ||
                `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(currentUser?.correo || 'me')}`,
            }}
            style={styles.myAvatar}
          />
          <View style={styles.headerTitles}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Mi Cuenta</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
              {currentUser?.nombre || 'Usuario'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.surface }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={isDarkMode ? '#fbbf24' : '#64748b'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.surface }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Buscar conversaciones..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de Conversaciones */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversationItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingConversations}
            onRefresh={() => {
              loadConversations();
              loadAvailableUsers();
            }}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          !isLoadingConversations && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="chat-plus-outline"
                size={64}
                color={colors.textMuted}
                style={{ opacity: 0.6, marginBottom: 12 }}
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery ? 'No hay resultados' : 'Sin conversaciones aún'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery
                  ? 'Intenta con otro término de búsqueda.'
                  : 'Pulsa el botón "+" para iniciar un chat con un usuario registrado en Atlas.'}
              </Text>
              <TouchableOpacity
                style={[styles.emptyActionBtn, { backgroundColor: colors.accent }]}
                onPress={() => setIsNewChatModalVisible(true)}
              >
                <Ionicons name="person-add-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Nuevo Chat</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Botón Flotante para Nuevo Chat */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent,
            bottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => {
          loadAvailableUsers();
          setIsNewChatModalVisible(true);
        }}
      >
        <Ionicons name="chatbubbles" size={26} color="#ffffff" />
      </TouchableOpacity>

      {/* MODAL DE NUEVO CHAT (LISTADO DE USUARIOS DE MONGODB ATLAS) */}
      <Modal
        visible={isNewChatModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNewChatModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nuevo Mensaje</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Selecciona un usuario de Atlas para chatear
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsNewChatModalVisible(false)}
                style={[styles.closeModalBtn, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Buscador de usuarios */}
            <View style={[styles.modalSearchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Buscar por nombre o correo..."
                placeholderTextColor={colors.textMuted}
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
              />
            </View>

            {isStartingChat ? (
              <View style={styles.loadingModalContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingModalText, { color: colors.textSecondary }]}>
                  Iniciando conversación...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => {
                  const avatarUri =
                    item.avatar ||
                    `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(item.correo || item.nombre)}`;
                  const isOnline = item.estado === 'activo';

                  return (
                    <TouchableOpacity
                      style={[styles.userRow, { borderBottomColor: colors.border }]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectUser(item)}
                    >
                      <View style={styles.avatarWrapper}>
                        <Image source={{ uri: avatarUri }} style={styles.userAvatar} />
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isOnline ? '#22c55e' : '#94a3b8' },
                          ]}
                        />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={[styles.userNameRow, { color: colors.textPrimary }]}>
                          {item.nombre}
                        </Text>
                        <Text style={[styles.userEmailRow, { color: colors.textMuted }]}>
                          {item.correo}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isOnline ? '#dcfce7' : colors.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: isOnline ? '#166534' : colors.textMuted },
                          ]}
                        >
                          {isOnline ? 'Activo' : 'Offline'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                      No se encontraron otros usuarios registrados.
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  myAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  headerTitles: {
    flex: 1,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#cbd5e1',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatInfo: {
    flex: 1,
    marginRight: 8,
  },
  chatTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
  },
  chatLastMessage: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    fontSize: 15,
    fontWeight: '600',
  },
  userEmailRow: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingModalContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingModalText: {
    marginTop: 10,
    fontSize: 14,
  },
});
