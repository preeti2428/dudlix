import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import { widgetBridge } from '../services/widgetBridge';
import { Room, WidgetSize, WidgetTheme, PreviewStyle } from '../shared/types';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface WidgetSettingsScreenProps {
  navigation: any;
}

export const WidgetSettingsScreen: React.FC<WidgetSettingsScreenProps> = ({ navigation }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<WidgetSize>('medium');
  const [selectedTheme, setSelectedTheme] = useState<WidgetTheme>('lavender');
  const [selectedStyle, setSelectedStyle] = useState<PreviewStyle>('paper');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const user = await api.getCurrentUser();
      const roomsRes = await api.getMyRooms();
      setRooms(roomsRes.rooms || []);

      if (roomsRes.rooms && roomsRes.rooms.length > 0) {
        setSelectedRoomId(roomsRes.rooms[0].roomId);
        if (user) {
          const prefRes = await api.getWidgetPreferences(user.userId, roomsRes.rooms[0].roomId);
          if (prefRes.preferences) {
            setSelectedSize(prefRes.preferences.widgetSize || 'medium');
            setSelectedTheme(prefRes.preferences.theme || 'lavender');
            setSelectedStyle(prefRes.preferences.previewStyle || 'paper');
          }
        }
      }
    } catch (err: any) {
      console.warn('Error loading widget settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const user = await api.getCurrentUser();
      if (!user || !selectedRoomId) return;

      // 1. Save preferences on server
      await api.saveWidgetPreferences({
        userId: user.userId,
        roomId: selectedRoomId,
        widgetSize: selectedSize,
        theme: selectedTheme,
        previewStyle: selectedStyle,
      });

      // 2. Fetch updated widget payload
      const widgetRes = await api.getWidgetDataForRoom(selectedRoomId, user.userId);
      if (widgetRes.widget) {
        // 3. Update native iOS / Android widgets immediately
        await widgetBridge.updateNativeWidget({
          ...widgetRes.widget,
          theme: selectedTheme,
          size: selectedSize,
        });
      }

      Alert.alert('Settings Saved', 'Home-screen widget theme and size preferences have been updated!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save widget settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Widget Customization</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Section 1: Active Connected Room */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Displayed Room / Friend</Text>
            <Text style={styles.sectionSub}>Choose which shared canvas your home widget displays.</Text>

            {rooms.length === 0 ? (
              <Text style={styles.noRoomsText}>No connected rooms yet. Connect with a friend first.</Text>
            ) : (
              rooms.map((r) => (
                <TouchableOpacity
                  key={r.roomId}
                  style={[
                    styles.roomOption,
                    selectedRoomId === r.roomId && styles.roomOptionSelected,
                  ]}
                  onPress={() => setSelectedRoomId(r.roomId)}
                >
                  <Text style={[styles.roomOptionTitle, selectedRoomId === r.roomId && styles.textSelected]}>
                    {r.name}
                  </Text>
                  <Text style={styles.roomOptionMeta}>
                    {r.members.map((m) => m.username).join(' & ')}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Section 2: Default Widget Size */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Widget Size</Text>
            <View style={styles.choiceRow}>
              {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => (
                <TouchableOpacity
                  key={sz}
                  style={[styles.choicePill, selectedSize === sz && styles.choicePillActive]}
                  onPress={() => setSelectedSize(sz)}
                >
                  <Text style={[styles.choicePillText, selectedSize === sz && styles.choicePillTextActive]}>
                    {sz.charAt(0).toUpperCase() + sz.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section 3: Theme Palette */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Background Theme</Text>
            <Text style={styles.sectionSub}>Select the color tone for your home-screen widget.</Text>
            <View style={styles.themeGrid}>
              {[
                { id: 'lavender', name: 'Lavender', color: '#EEEAFE' },
                { id: 'soft-pink', name: 'Soft Pink', color: '#FFDCE8' },
                { id: 'purple', name: 'Royal Violet', color: '#D6D1EE' },
                { id: 'minimal-light', name: 'Pure White', color: '#FFFFFF' },
                { id: 'midnight-dark', name: 'Midnight Dark', color: '#1E1B2E' },
              ].map((th) => (
                <TouchableOpacity
                  key={th.id}
                  style={[
                    styles.themeOption,
                    { backgroundColor: th.color },
                    selectedTheme === th.id && styles.themeOptionActive,
                  ]}
                  onPress={() => setSelectedTheme(th.id as WidgetTheme)}
                >
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: th.id === 'midnight-dark' ? '#FFF' : COLORS.text },
                    ]}
                  >
                    {th.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save Action */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.saveBtn}
            onPress={handleSavePreferences}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save & Apply to Widget</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
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
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
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
  },
  noRoomsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  roomOption: {
    backgroundColor: '#FAF9FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E5F5',
  },
  roomOptionSelected: {
    backgroundColor: '#F4F2FF',
    borderColor: COLORS.primary,
  },
  roomOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  textSelected: {
    color: COLORS.primary,
  },
  roomOptionMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choicePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#E8E5F5',
  },
  choicePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  choicePillTextActive: {
    color: '#FFFFFF',
  },
  themeGrid: {
    gap: 8,
  },
  themeOption: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E8E5F5',
    alignItems: 'center',
  },
  themeOptionActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginTop: 10,
    ...SHADOWS.md,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

