import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9FF" />

      {/* Top Graphic Showcase */}
      <View style={styles.heroSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>HOME-SCREEN WIDGET FIRST</Text>
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.heroEmoji}>🎨</Text>
        </View>

        <Text style={styles.brandTitle}>Doodlix</Text>
        <Text style={styles.tagline}>"Draw on your screen. Connect through creativity."</Text>

        <Text style={styles.description}>
          Share live doodles directly through your phone's home-screen widget. Connect with friends across iPhone and Android.
        </Text>
      </View>

      {/* Feature Pills */}
      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <Text style={styles.featureEmoji}>📱</Text>
          <Text style={styles.featureTitle}>Home-Screen Widget</Text>
          <Text style={styles.featureSub}>See updates without opening an app</Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureEmoji}>🔄</Text>
          <Text style={styles.featureTitle}>Cross-Platform</Text>
          <Text style={styles.featureSub}>iPhone ↔ Android live syncing</Text>
        </View>
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Auth', { initialMode: 'signup' })}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Auth', { initialMode: 'login' })}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>

        {/* Instant 1-Click Demo Buttons for Fast Evaluation */}
        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>Fast Cross-Platform Evaluation:</Text>
          <View style={styles.demoBtnRow}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => navigation.navigate('Auth', { instantDemoRole: 'A' })}
            >
              <Text style={styles.demoBtnText}>🤖 Person A (Android)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => navigation.navigate('Auth', { instantDemoRole: 'B' })}
            >
              <Text style={styles.demoBtnText}>🍏 Person B (iPhone)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  badge: {
    backgroundColor: COLORS.lavender,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
  },
  heroEmoji: {
    fontSize: 44,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  featureEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  featureSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  footer: {
    gap: 10,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEEAFE',
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#F4F2FF',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5F5',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
});

