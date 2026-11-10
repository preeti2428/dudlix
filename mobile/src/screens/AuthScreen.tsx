import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface AuthScreenProps {
  navigation: any;
  route: any;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation, route }) => {
  const initialMode = route.params?.initialMode || 'login';
  const instantDemoRole = route.params?.instantDemoRole;

  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (instantDemoRole) {
      handleDemoLogin(instantDemoRole);
    }
  }, [instantDemoRole]);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await api.login(email.trim(), password);
      } else {
        await api.signup(username.trim(), email.trim(), password);
      }
      navigation.replace('Home');
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'A' | 'B') => {
    setLoading(true);
    try {
      await api.demoLogin(role);
      navigation.replace('Home');
    } catch (err: any) {
      Alert.alert('Demo Login Failed', err.message || 'Could not connect to Doodlix server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>DOODLIX</Text>
            </View>
            <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? 'Sign in to access your shared home-screen widget.'
                : 'Connect with your favorite person through drawings.'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Alex"
                  placeholderTextColor="#A09CB8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#A09CB8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#A09CB8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchModeText}>
                {isLogin
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.switchModeHighlight}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Section */}
          <View style={styles.demoBox}>
            <Text style={styles.demoBoxTitle}>⚡ Quick 1-Click Demo Profiles</Text>
            <Text style={styles.demoBoxSub}>
              Instantly simulate Person A & Person B connecting across devices.
            </Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => handleDemoLogin('A')}
                disabled={loading}
              >
                <Text style={styles.demoPillText}>🤖 Alex (Person A)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoPill}
                onPress={() => handleDemoLogin('B')}
                disabled={loading}
              >
                <Text style={styles.demoPillText}>🍏 Taylor (Person B)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    backgroundColor: COLORS.lavender,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 12,
  },
  logoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    ...SHADOWS.md,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9F8FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5F5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOWS.sm,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  switchModeHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  demoBox: {
    marginTop: 24,
    backgroundColor: '#F4F2FF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5F5',
    alignItems: 'center',
  },
  demoBoxTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  demoBoxSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  demoPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6D1EE',
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
});

