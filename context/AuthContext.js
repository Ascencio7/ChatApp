import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRegister, apiLogin, apiLogout, apiLoginWithGoogle } from '../services/api';

const SESSION_KEY = '@chatapp_current_session';
const TOKEN_KEY = '@chatapp_auth_token';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Carga inicial de sesión guardada
  useEffect(() => {
    (async () => {
      try {
        const sessionData = await AsyncStorage.getItem(SESSION_KEY);
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (sessionData) {
          setCurrentUser(JSON.parse(sessionData));
        }
        if (token) {
          setAuthToken(token);
        }
      } catch (err) {
        console.error('Error restaurando sesión:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    })();
  }, []);

  // Registrar un nuevo usuario en MongoDB Atlas
  const register = async (nombre, correo, contrasena, avatar = '') => {
    try {
      const response = await apiRegister(nombre, correo, contrasena, avatar);

      if (response && response.success) {
        const user = response.user;
        const token = response.token;

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
        if (token) {
          await AsyncStorage.setItem(TOKEN_KEY, token);
          setAuthToken(token);
        }

        setCurrentUser(user);
        return { success: true, user };
      } else {
        return { success: false, error: response?.error || 'No se pudo completar el registro.' };
      }
    } catch (err) {
      console.error('Error en register:', err);
      return { success: false, error: err.message || 'Error de conexión con el servidor.' };
    }
  };

  // Iniciar sesión con email/contraseña
  const login = async (correo, contrasena) => {
    try {
      const response = await apiLogin(correo, contrasena);

      if (response && response.success) {
        const user = response.user;
        const token = response.token;

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
        if (token) {
          await AsyncStorage.setItem(TOKEN_KEY, token);
          setAuthToken(token);
        }

        setCurrentUser(user);
        return { success: true, user };
      } else {
        return { success: false, error: response?.error || 'Credenciales inválidas.' };
      }
    } catch (err) {
      console.error('Error en login:', err);
      return { success: false, error: err.message || 'Error de conexión con el servidor.' };
    }
  };

  // Iniciar sesión con Google (recibe el perfil de Google ya autenticado por Firebase)
  const loginWithGoogle = async ({ nombre, correo, avatar, googleId }) => {
    try {
      const response = await apiLoginWithGoogle({ nombre, correo, avatar, googleId });

      if (response && response.success) {
        const user = response.user;
        const token = response.token;

        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
        if (token) {
          await AsyncStorage.setItem(TOKEN_KEY, token);
          setAuthToken(token);
        }

        setCurrentUser(user);
        return { success: true, user };
      } else {
        return { success: false, error: response?.error || 'No se pudo autenticar con Google.' };
      }
    } catch (err) {
      console.error('Error en loginWithGoogle:', err);
      return { success: false, error: err.message || 'Error de conexión con el servidor.' };
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      if (currentUser?.id) {
        await apiLogout(currentUser.id).catch(() => {});
      }
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
      setCurrentUser(null);
      setAuthToken(null);
      return { success: true };
    } catch (err) {
      console.error('Error en logout:', err);
      setCurrentUser(null);
      return { success: true };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authToken,
        isLoadingAuth,
        register,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
