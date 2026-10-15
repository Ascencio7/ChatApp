import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// 1. EL COMPONENTE FIELD SE SACA FUERA PARA EVITAR QUE SE RECREE Y PIERDA EL FOCO
const Field = ({ 
  label, 
  icon, 
  value, 
  onChange, 
  secure, 
  toggleVisible, 
  onToggle, 
  fieldKey, 
  keyboardType, 
  returnKeyType, 
  onSubmit,
  focusedField,
  setFocusedField,
  colors,
  accent,
  accentSoft
}) => (
  <View style={styles.fieldGroup}>
    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
    <View
      style={[
        styles.inputRow,
        {
          backgroundColor: accentSoft,
          borderColor: focusedField === fieldKey ? accent : 'transparent',
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={focusedField === fieldKey ? accent : colors.textMuted}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.input, { color: colors.textPrimary }]}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocusedField(fieldKey)}
        onBlur={() => setFocusedField(null)}
        secureTextEntry={secure && !toggleVisible}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType || 'default'}
        returnKeyType={returnKeyType || 'next'}
        onSubmitEditing={onSubmit}
        blurOnSubmit={false}
      />
      {secure && (
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={toggleVisible ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Datos incompletos', 'Por favor llena todos los campos.');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('Nombre muy corto', 'El nombre debe tener al menos 3 caracteres.');
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Contraseña corta', 'Mínimo 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Verifica que sean idénticas.');
      return;
    }

    setIsSubmitting(true);
    const result = await register(username.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        '🎉 ¡Cuenta creada!',
        `¡Bienvenido a AVASA CHAT, ${username.trim()}!\n\nYa puedes iniciar conversaciones y conectarte con otros usuarios.`,
        [{ text: 'Empezar', onPress: () => navigation.replace('Home') }]
      );
    } else {
      Alert.alert('Error al registrar', result.error || 'No se pudo crear la cuenta.');
    }
  };

  const accent = '#6366f1';
  const accentSoft = isDarkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Barra superior */}
      <View style={[
        styles.topBar,
        { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 52 }
      ]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={isDarkMode ? 'sunny' : 'moon'}
            size={18}
            color={isDarkMode ? '#fbbf24' : accent}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: accent }]}>
            <Ionicons name="person-add" size={28} color="#fff" />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Crear cuenta</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Únete a AVASA CHAT y conecta con todos
          </Text>
        </View>

        {/* Formulario */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Field
            label="Nombre de usuario"
            icon="person-outline"
            value={username}
            onChange={setUsername}
            fieldKey="username"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            colors={colors}
            accent={accent}
            accentSoft={accentSoft}
          />
          <Field
            label="Correo electrónico"
            icon="mail-outline"
            value={email}
            onChange={setEmail}
            fieldKey="email"
            keyboardType="email-address"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            colors={colors}
            accent={accent}
            accentSoft={accentSoft}
          />
          <Field
            label="Contraseña"
            icon="lock-closed-outline"
            value={password}
            onChange={setPassword}
            fieldKey="password"
            secure
            toggleVisible={showPassword}
            onToggle={() => setShowPassword(p => !p)}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            colors={colors}
            accent={accent}
            accentSoft={accentSoft}
          />
          <Field
            label="Confirmar contraseña"
            icon="shield-checkmark-outline"
            value={confirmPassword}
            onChange={setConfirmPassword}
            fieldKey="confirm"
            secure
            toggleVisible={showConfirm}
            onToggle={() => setShowConfirm(p => !p)}
            returnKeyType="done"
            onSubmit={handleRegister}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            colors={colors}
            accent={accent}
            accentSoft={accentSoft}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: accent, opacity: isSubmitting ? 0.75 : 1 }]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Crear cuenta</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Pie */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            ¿Ya tienes cuenta?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.footerLink, { color: accent }]}>Inicia sesión</Text>
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
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 70 : 100,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
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
    marginTop: 10,
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