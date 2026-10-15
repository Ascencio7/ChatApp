import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  apiGetConversations,
  apiCreateConversation,
  apiGetMessages,
  apiSendMessage,
  apiMarkAsRead,
  apiGetUsers,
} from '../services/api';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [errorChat, setErrorChat] = useState(null);

  // Cargar lista de conversaciones del usuario logueado
  const loadConversations = useCallback(async () => {
    if (!currentUser?.id) {
      setConversations([]);
      return;
    }
    try {
      setIsLoadingConversations(true);
      setErrorChat(null);
      const data = await apiGetConversations(currentUser.id);
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
      setErrorChat(err.message);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser]);

  // Cargar usuarios para iniciar nueva conversación
  const loadAvailableUsers = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const users = await apiGetUsers(currentUser.id);
      setAvailableUsers(Array.isArray(users) ? users : []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  }, [currentUser]);

  // Recargar conversaciones cuando cambie el usuario actual
  useEffect(() => {
    if (currentUser?.id) {
      loadConversations();
      loadAvailableUsers();
    } else {
      setConversations([]);
      setActiveMessages([]);
      setAvailableUsers([]);
    }
  }, [currentUser, loadConversations, loadAvailableUsers]);

  // Iniciar o recuperar conversación con otro usuario
  const startConversation = async (destinatarioId) => {
    if (!currentUser?.id) return null;
    try {
      const response = await apiCreateConversation(currentUser.id, destinatarioId);
      if (response && response.conversacion) {
        // Refrescar lista de conversaciones
        await loadConversations();
        return response.conversacion;
      }
      return null;
    } catch (err) {
      console.error('Error creando conversación:', err);
      throw err;
    }
  };

  // Cargar mensajes de una conversación
  const loadMessages = async (conversacionId) => {
    if (!conversacionId) return;
    try {
      setIsLoadingMessages(true);
      const msgs = await apiGetMessages(conversacionId);
      setActiveMessages(Array.isArray(msgs) ? msgs : []);
      // Marcar como leídos
      if (currentUser?.id) {
        apiMarkAsRead(conversacionId, currentUser.id).catch(() => {});
      }
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Enviar mensaje
  const sendChatMessage = async (conversacionId, texto) => {
    if (!conversacionId || !currentUser?.id || !texto?.trim()) return null;
    try {
      const res = await apiSendMessage(conversacionId, currentUser.id, texto.trim());
      if (res && res.mensaje) {
        // Agregar al estado local de mensajes
        setActiveMessages((prev) => [...prev, res.mensaje]);
        // Refrescar lista de conversaciones en segundo plano para actualizar ultimoMensaje
        loadConversations();
        return res.mensaje;
      }
      return null;
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      throw err;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeMessages,
        availableUsers,
        isLoadingConversations,
        isLoadingMessages,
        errorChat,
        loadConversations,
        loadAvailableUsers,
        startConversation,
        loadMessages,
        sendChatMessage,
        setActiveMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChats debe ser utilizado dentro de un ChatProvider');
  }
  return context;
}
