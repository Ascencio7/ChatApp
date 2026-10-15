import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Necesario para que el navegador cierre correctamente en Android
WebBrowser.maybeCompleteAuthSession();

// Web Client ID de google-services.json (client_type: 3)
const WEB_CLIENT_ID = '859854572760-ibjqua7vi1hkfl627dd5ps3smp2rj41t.apps.googleusercontent.com';

export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Configuración de Google Auth Session
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Escuchar resultado del flujo OAuth de Google
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication?.accessToken);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Error con Google', 'No se pudo completar el inicio de sesión con Google.');
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken) => {
    if (!accessToken) {
      setIsGoogleLoading(false);
      Alert.alert('Error', 'No se pudo obtener el token de Google.');
      return;
    }

    try {
      // Obtener info del perfil de Google con el access token
      const profileRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = await profileRes.json();

      const result = await loginWithGoogle({
        nombre: profile.name || profile.given_name || 'Usuario Google',
        correo: profile.email,
        avatar: profile.picture,
        googleId: profile.id,
      });

      setIsGoogleLoading(false);

      if (result.success) {
        navigation.replace('Home');
      } else {
        Alert.alert('Error', result.error || 'No se pudo iniciar sesión con Google.');
      }
    } catch (err) {
      setIsGoogleLoading(false);
      Alert.alert('Error', 'No se pudo obtener tu perfil de Google. Verifica tu conexión.');
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      Alert.alert('No disponible', 'El inicio de sesión con Google no está listo. Espera un momento.');
      return;
    }
    setIsGoogleLoading(true);
    await promptAsync();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    setIsSubmitting(true);
    const result = await login(email.trim(), password);
    setIsSubmitting(false);
    if (result.success) {
      navigation.replace('Home');
    } else {
      Alert.alert('Error de inicio de sesión', result.error || 'Credenciales inválidas');
    }
  };

  const accent = '#6366f1';
  const accentSoft = isDarkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Toggle tema */}
      <TouchableOpacity
        style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isDarkMode ? 'sunny' : 'moon'}
          size={18}
          color={isDarkMode ? '#fbbf24' : accent}
        />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Marca */}
        <View style={styles.brand}>
          <View style={[styles.logoCircle, { backgroundColor: accent }]}>
            <Ionicons name="chatbubbles" size={32} color="#fff" />
          </View>
          <Text style={[styles.brandName, { color: colors.textPrimary }]}>
            AVASA <Text style={{ color: accent }}>CHAT</Text>
          </Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
            Conecta. Conversa. Comparte.
          </Text>
        </View>

        {/* Card formulario */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Iniciar sesión</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Bienvenido de vuelta
          </Text>

          {/* ── Botón Google ── */}
          <TouchableOpacity
            style={[
              styles.googleBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: isGoogleLoading ? 0.7 : 1,
              },
            ]}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading || !request}
            activeOpacity={0.85}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <>
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png' }}
                  style={styles.googleIcon}
                />
                <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
                  Continuar con Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divisor */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>o</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Correo */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Correo electrónico
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: accentSoft,
                  borderColor: focusedField === 'email' ? accent : 'transparent',
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={focusedField === 'email' ? accent : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              Contraseña
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: accentSoft,
                  borderColor: focusedField === 'password' ? accent : 'transparent',
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={focusedField === 'password' ? accent : colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón principal */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accent, opacity: isSubmitting ? 0.75 : 1 }]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Ingresar</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Pie */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            ¿No tienes una cuenta?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.footerLink, { color: accent }]}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  themeBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 52,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 10,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 60 : 90,
    paddingBottom: 40,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  brandTagline: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  // ── Google ──
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  // ── Campos ──
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
