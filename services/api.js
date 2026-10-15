import { Platform } from 'react-native';

const RENDER_URL = 'https://chatapp-4w36.onrender.com/api';

// Lista de URLs a intentar (priorizando la nube para funcionar con datos móviles o cualquier red)
function getBaseUrls() {
  return [
    RENDER_URL,
    // Opcional: IP local o emulador como respaldo para desarrollo sin internet
    // 'http://192.168.1.40:5000/api',
    // 'http://10.0.2.2:5000/api',
  ];
}

export const API_BASE_URL = RENDER_URL;

// Helper para peticiones con timeout y manejo claro de errores
async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const urlsToTry = getBaseUrls();
  let lastError = null;

  for (const baseUrl of urlsToTry) {
    let response;
    let data;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout para la nube

      response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      data = await response.json().catch(() => null);
    } catch (err) {
      lastError = err;
      // Solo si fue un error de red o timeout, intenta la siguiente URL
      continue;
    }

    // Si el servidor respondió, no intentamos más URLs
    if (!response.ok) {
      throw new Error(data?.error || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  // Mensaje amigable si no hay conexión con Render
  const friendlyMsg =
    'No se pudo conectar al servidor en la nube. Verifica tu conexión a internet.';
  throw new Error(lastError?.message?.includes('Network') || lastError?.message?.includes('connect')
    ? friendlyMsg
    : lastError?.message || friendlyMsg);
}

// --- SERVICIOS DE AUTENTICACIÓN ---

export async function apiRegister(nombre, correo, contrasena, avatar = '') {
  return await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre, correo, contrasena, avatar }),
  });
}

export async function apiLogin(correo, contrasena) {
  return await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, contrasena }),
  });
}

export async function apiLogout(userId) {
  return await request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function apiLoginWithGoogle({ nombre, correo, avatar, googleId }) {
  return await request('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ nombre, correo, avatar, googleId }),
  });
}

// --- SERVICIOS DE USUARIOS ---

export async function apiGetUsers(currentUserId) {
  const query = currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : '';
  return await request(`/usuarios${query}`, {
    method: 'GET',
  });
}

// --- SERVICIOS DE CONVERSACIONES ---

export async function apiGetConversations(userId) {
  return await request(`/conversaciones?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
  });
}

export async function apiCreateConversation(remitenteId, destinatarioId) {
  return await request('/conversaciones', {
    method: 'POST',
    body: JSON.stringify({ remitenteId, destinatarioId }),
  });
}

// --- SERVICIOS DE MENSAJES ---

export async function apiGetMessages(conversacionId) {
  return await request(`/mensajes/${encodeURIComponent(conversacionId)}`, {
    method: 'GET',
  });
}

export async function apiSendMessage(conversacionId, remitente, texto) {
  return await request('/mensajes', {
    method: 'POST',
    body: JSON.stringify({ conversacionId, remitente, texto }),
  });
}

export async function apiMarkAsRead(conversacionId, currentUserId) {
  return await request(`/mensajes/leer/${encodeURIComponent(conversacionId)}`, {
    method: 'PUT',
    body: JSON.stringify({ currentUserId }),
  });
}