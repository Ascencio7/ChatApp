import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  mode: 'light',
  background: '#f8fafc',
  card: '#ffffff',
  surface: '#f1f5f9',
  surfaceElevated: '#e2e8f0',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  accent: '#2563eb',
  accentGradient: ['#2563eb', '#7c3aed'],
  accentLight: '#dbeafe',
  geminiSparkle: '#4f46e5',
  inputBg: '#ffffff',
  bubbleUser: '#2563eb',
  bubbleUserText: '#ffffff',
  bubbleOther: '#f1f5f9',
  bubbleOtherText: '#0f172a',
  danger: '#ef4444',
  success: '#10b981',
};

export const darkColors = {
  mode: 'dark',
  background: '#131314', // Fondo icónico de Gemini Dark
  card: '#1e1f20',
  surface: '#282a2c',
  surfaceElevated: '#313538',
  textPrimary: '#e3e3e3',
  textSecondary: '#8e918f',
  textMuted: '#5e6163',
  border: '#313538',
  accent: '#a8c7fa', // Azul característico de Google Gemini
  accentGradient: ['#4285f4', '#9b72cb'],
  accentLight: '#1f2e46',
  geminiSparkle: '#a8c7fa',
  inputBg: '#1e1f20',
  bubbleUser: '#1b437c',
  bubbleUserText: '#ffffff',
  bubbleOther: '#282a2c',
  bubbleOtherText: '#e3e3e3',
  danger: '#f87171',
  success: '#34d399',
};

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@chatapp_theme_mode';

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved !== null) {
          setIsDarkMode(saved === 'dark');
        }
      } catch (err) {
        console.error('Error loading theme:', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    try {
      const nextMode = !isDarkMode;
      setIsDarkMode(nextMode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode ? 'dark' : 'light');
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  };

  const setTheme = async (dark) => {
    try {
      setIsDarkMode(dark);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
    } catch (err) {
      console.error('Error setting theme:', err);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme, colors, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

