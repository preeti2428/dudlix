import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { api } from '../services/api';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<any>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const u = await api.getCurrentUser();
      setUser(u);
      const url = await api.getBaseUrl();
      setServerUrl(url);

      // Check health
      try {
        const res = await fetch(`${url}/api/health`);
        if (res.ok) setServerStatus('online');
        else setServerStatus('offline');
      } catch {
        setServerStatus('offline');
      }
    } catch (err: any) {
      console.warn('Profile load err:', err.message);
    }
  };

  const handleUpdateServerUrl = async () => {
    try {
      await api.setBaseUrl(serverUrl.trim());
      Alert.alert('Updated', 'Doodlix backend server URL has been saved.');
      loadProfile();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Doodlix?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await api.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account & Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.initials || 'DL'}</Text>
          </View>
          <Text style={styles.username}>{user?.username || 'Doodler'}</Text>
          <Text style={styles.email}>{user?.email || 'user@doodlix.app'}</Text>
        </View>

        {/* Backend Connectivity Configuration */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Backend Server Connection</Text>
          <Text style={styles.sectionSub}>
            Point the companion app and native widgets to your local machine IP or cloud backend.
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: serverStatus === 'online' ? COLORS.success : COLORS.error },
              ]}
            />
            <Text style={styles.statusLabel}>
              Server Status:{' '}
              <Text style={{ fontWeight: '700', color: serverStatus === 'online' ? COLORS.success : COLORS.error }}>
                {serverStatus.toUpperCase()}
              </Text>
            </Text>
          </View>

          <TextInput
            style={styles.serverInput}
            value={serverUrl}
            onChangeText={setServerUrl}
            placeholder="http://192.168.1.X:4000"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.saveServerBtn} onPress={handleUpdateServerUrl}>
            <Text style={styles.saveServerBtnText}>Test & Save Server URL</Text>
          </TouchableOpacity>
        </View>

        {/* Home Screen Widget Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Home-Screen Widget Integration</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>iOS App Group:</Text>
            <Text style={styles.infoValue}>group.com.doodlix.app</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Android Provider:</Text>
            <Text style={styles.infoValue}>DoodlixWidgetProvider</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Realtime Protocol:</Text>
            <Text style={styles.infoValue}>Socket.IO Vector Streaming</Text>
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEAFE',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  placeholder: {
    width: 36,
  },
  scrollContent: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEAFE',
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  username: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  email: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.text,
  },
  serverInput: {
    backgroundColor: '#FAF9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 10,
  },
  saveServerBtn: {
    backgroundColor: '#F4F2FF',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6D1EE',
  },
  saveServerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F2FF',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutBtn: {
    backgroundColor: '#FFF0F5',
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFDCE8',
    marginTop: 8,
  },
  logoutBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 14,
  },
});

