import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { currentUser, logout } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const displayName = currentUser?.nombre || currentUser?.username || 'Usuario';
  const displayEmail = currentUser?.correo || currentUser?.email || 'Sin correo registrado';
  const displayStatus = currentUser?.estado === 'activo' ? 'En línea / Activo' : 'Offline';
  const avatarUrl =
    currentUser?.avatar ||
    `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(displayEmail || displayName)}`;

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Deseas cerrar tu sesión actual?',
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
        },
      ]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Mi Perfil & Ajustes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Perfil del Usuario */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
            />
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
            </View>
          </View>

          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {displayEmail}
            </Text>

            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="shield-checkmark" size={13} color="#166534" style={{ marginRight: 4 }} />
                <Text style={[styles.roleBadgeText, { color: '#166534' }]}>Atlas DB Auth</Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.smallDot, { backgroundColor: currentUser?.estado === 'offline' ? '#94a3b8' : '#22c55e' }]} />
                <Text style={[styles.statusBadgeText, { color: colors.textSecondary }]}>
                  {displayStatus}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Datos Técnicos de la Cuenta */}
        {currentUser?.id && (
          <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>ID de Usuario (ObjectId):</Text>
              <Text style={[styles.metaValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {currentUser.id}
              </Text>
            </View>
          </View>
        )}

        {/* Sección de Apariencia */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>APARIENCIA</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                <Ionicons
                  name={isDarkMode ? 'moon' : 'sunny'}
                  size={20}
                  color={isDarkMode ? '#fbbf24' : '#f59e0b'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Modo Oscuro</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {isDarkMode ? 'Activado (Tema Oscuro)' : 'Desactivado (Tema Claro)'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.accent }}
              thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
            />
          </View>
        </View>

        {/* Sección del Sistema / Base de Datos */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>BASE DE DATOS & SERVICIOS</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* MongoDB Atlas */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <MaterialCommunityIcons name="database-check" size={22} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>MongoDB Atlas Cloud</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Cluster: avasacluster / BD: chatapp
                </Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

          {/* Colecciones */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
                <Ionicons name="folder-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Colecciones BSON</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  usuarios, conversaciones, mensajes
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>3 activas</Text>
          </View>
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: '#ef4444', backgroundColor: colors.card }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          ChatApp v1.0 • React Native & MongoDB Atlas
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#cbd5e1',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 2,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  smallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  metaCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    maxWidth: '55%',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 10,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
  },
});
