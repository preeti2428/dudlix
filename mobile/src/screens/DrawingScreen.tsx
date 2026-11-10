import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CanvasDrawing } from '../components/CanvasDrawing';
import { api } from '../services/api';
import { widgetBridge } from '../services/widgetBridge';
import { Stroke } from '../shared/types';
import { COLORS, RADIUS } from '../theme/theme';

interface DrawingScreenProps {
  navigation: any;
  route: any;
}

export const DrawingScreen: React.FC<DrawingScreenProps> = ({ navigation, route }) => {
  const {
    roomId,
    roomName = 'Doodlix Canvas',
    friendName = 'Friend',
    friendInitials = 'DX',
    initialStrokes = [],
  } = route.params || {};

  const [saving, setSaving] = useState(false);

  const handleSaveToWidget = async (strokes: Stroke[]) => {
    setSaving(true);
    try {
      // 1. Save to server database
      const saveRes = await api.saveDrawing(roomId, strokes);

      // 2. Refresh widget data from server
      const widgetRes = await api.getWidgetDataForRoom(roomId);
      if (widgetRes.widget) {
        // 3. Update native iOS / Android home-screen widgets
        await widgetBridge.updateNativeWidget(widgetRes.widget);
      }

      Alert.alert(
        '🎨 Doodlix Sent!',
        `Your drawing has been updated and sent to ${friendName}'s home-screen widget!`,
        [
          {
            text: 'Keep Drawing',
            style: 'cancel',
          },
          {
            text: 'Go to Home',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not synchronize drawing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9FF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{roomName}</Text>
          <Text style={styles.headerSub}>Shared with {friendName}</Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Live Canvas Drawing Component */}
      <CanvasDrawing
        roomId={roomId}
        initialStrokes={initialStrokes}
        partnerName={friendName}
        partnerInitials={friendInitials}
        onSaveToWidget={handleSaveToWidget}
      />
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEAFE',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  headerRightPlaceholder: {
    width: 36,
  },
});

