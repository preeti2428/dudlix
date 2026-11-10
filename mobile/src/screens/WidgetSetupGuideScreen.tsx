import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface WidgetSetupGuideScreenProps {
  navigation: any;
}

export const WidgetSetupGuideScreen: React.FC<WidgetSetupGuideScreenProps> = ({ navigation }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'ios' | 'android'>(
    Platform.OS === 'android' ? 'android' : 'ios'
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home-Screen Widget Guide</Text>
        <View style={styles.placeholder} />
      </View>

      {/* OS Selector Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, selectedPlatform === 'ios' && styles.tabBtnActive]}
          onPress={() => setSelectedPlatform('ios')}
        >
          <Text style={[styles.tabBtnText, selectedPlatform === 'ios' && styles.tabBtnTextActive]}>
            🍏 iPhone Setup (iOS)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, selectedPlatform === 'android' && styles.tabBtnActive]}
          onPress={() => setSelectedPlatform('android')}
        >
          <Text style={[styles.tabBtnText, selectedPlatform === 'android' && styles.tabBtnTextActive]}>
            🤖 Android Setup
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {selectedPlatform === 'ios' ? (
          <View>
            <View style={styles.introCard}>
              <Text style={styles.introBadge}>iOS WIDGETKIT</Text>
              <Text style={styles.introTitle}>Adding Doodlix to your iPhone Home Screen</Text>
              <Text style={styles.introSub}>
                iOS WidgetKit displays your friend's latest drawing directly on your home screen. Tapping it opens the shared canvas immediately.
              </Text>
            </View>

            {/* Step 1 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Enter Home-Screen Edit Mode</Text>
                <Text style={styles.stepText}>
                  Go to your iPhone home screen. Touch and hold any empty background area or app icon until the apps begin to jiggle.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Open the Widget Gallery</Text>
                <Text style={styles.stepText}>
                  Tap the <Text style={styles.bold}>Add button (+)</Text> in the upper-left or upper-right corner of the screen.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Select Doodlix & Choose Size</Text>
                <Text style={styles.stepText}>
                  Search for <Text style={styles.bold}>Doodlix</Text>. Swipe left or right to choose between <Text style={styles.bold}>Small, Medium, or Large</Text>, then tap <Text style={styles.bold}>Add Widget</Text>.
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Tap to Draw Anytime</Text>
                <Text style={styles.stepText}>
                  Tap anywhere on the Doodlix widget to open the full drawing screen directly into your friend's shared canvas.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <View style={styles.introCard}>
              <Text style={styles.introBadge}>ANDROID APPWIDGET & GLANCE</Text>
              <Text style={styles.introTitle}>Adding Doodlix to your Android Home Screen</Text>
              <Text style={styles.introSub}>
                Android allows customizable widget sizes with direct touch interactions and auto-refresh workers.
              </Text>
            </View>

            {/* Step 1 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Touch and Hold Home Screen</Text>
                <Text style={styles.stepText}>
                  On your Android device home screen, touch and hold any empty space until the menu options appear.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Select Widgets</Text>
                <Text style={styles.stepText}>
                  Tap <Text style={styles.bold}>Widgets</Text> in the menu. Scroll through your app list or search for <Text style={styles.bold}>Doodlix</Text>.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Drag and Drop Widget</Text>
                <Text style={styles.stepText}>
                  Touch and hold the Doodlix widget, drag it to your desired home-screen location, and lift your finger. You can resize it by dragging its dots!
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Automatic Sync & Tap Action</Text>
                <Text style={styles.stepText}>
                  The widget continuously refreshes via Android WorkManager. Tap <Text style={styles.bold}>Open Canvas</Text> to draw a reply!
                </Text>
              </View>
            </View>
          </View>
        )}
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
  tabRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5F5',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    ...SHADOWS.sm,
  },
  introBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  introSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EEEAFE',
    ...SHADOWS.sm,
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.text,
  },
});

