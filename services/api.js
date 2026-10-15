import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

const PORT = '5000';
const FALLBACK_IP = '192.168.1.40';

// Obtener la IP dinámica de la computadora donde corre Expo Metro
function getHostIp() {
  try {
    // En Expo Go, hostUri contiene "192.168.x.x:8081"
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return ip;
      }
    }

    // React Native SourceCode
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
      if (address && address !== 'localhost' && address !== '127.0.0.1') {
        return address;
      }
    }
  } catch (e) {
    console.log('No se pudo detectar IP automática:', e?.message);
  }

  return FALLBACK_IP;
}

const SERVER_IP = getHostIp();

// Lista de URLs a intentar según el entorno
function getBaseUrls() {
  if (Platform.OS === 'web') {
    return [`http://localhost:${PORT}/api`];
  }

  // En dispositivo móvil (físico o emulador), priorizamos la IP de la computadora en la red Wi-Fi
  return [
    `http://${SERVER_IP}:${PORT}/api`,
    `http://${FALLBACK_IP}:${PORT}/api`,
    `http://10.0.2.2:${PORT}/api`, // Emulador Android
  ];
}

export const API_BASE_URL = `http://${SERVER_IP}:${PORT}/api`;

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
      const timeoutId = setTimeout(() => controller.abort(), 6000);

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

  // Mensaje amigable y descriptivo si el servidor no responde
  const friendlyMsg =
    'No se pudo conectar al servidor backend. Verifica que esté iniciado con "npm run server" en tu computadora y que tu teléfono esté en la misma red Wi-Fi.';
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
