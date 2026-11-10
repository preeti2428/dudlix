import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { WidgetPreview } from '../components/WidgetPreview';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { widgetBridge } from '../services/widgetBridge';
import { Room, WidgetPayload, WidgetSize, WidgetTheme, Stroke } from '../shared/types';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [widgetPayload, setWidgetPayload] = useState<WidgetPayload>({
    roomId: '',
    roomName: 'Doodlix Canvas',
    friendName: 'Connect Friend',
    friendInitials: 'DX',
    lastUpdated: new Date().toISOString(),
    lastUpdatedFormatted: 'Just now',
    strokesCount: 0,
    theme: 'lavender',
    size: 'medium',
    isConnected: false,
    deepLinkUrl: 'doodlix://connect',
  });
  const [latestStrokes, setLatestStrokes] = useState<Stroke[]>([]);
  const [selectedSize, setSelectedSize] = useState<WidgetSize>('medium');
  const [selectedTheme, setSelectedTheme] = useState<WidgetTheme>('lavender');
  const [platformMockup, setPlatformMockup] = useState<'ios' | 'android'>(
    Platform.OS === 'android' ? 'android' : 'ios'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [recentDrawings, setRecentDrawings] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);

      const roomsRes = await api.getMyRooms();
      if (roomsRes.rooms && roomsRes.rooms.length > 0) {
        const primaryRoom = roomsRes.rooms[0];
        setActiveRoom(primaryRoom);

        // Fetch widget data
        const widgetRes = await api.getWidgetDataForRoom(primaryRoom.roomId, user?.userId);
        if (widgetRes.widget) {
          setWidgetPayload(widgetRes.widget);
          setSelectedTheme(widgetRes.widget.theme || 'lavender');
        }

        // Fetch latest drawing strokes
        const drawingRes = await api.getLatestDrawing(primaryRoom.roomId);
        if (drawingRes.activeStrokes && drawingRes.activeStrokes.length > 0) {
          setLatestStrokes(drawingRes.activeStrokes);
        } else if (drawingRes.drawing?.strokes) {
          setLatestStrokes(drawingRes.drawing.strokes);
        }

        // Fetch drawing history
        const historyRes = await api.getDrawingHistory(primaryRoom.roomId, 5);
        if (historyRes.history) {
          setRecentDrawings(historyRes.history);
        }

        // Push to native widget bridge
        if (widgetRes.widget) {
          await widgetBridge.updateNativeWidget(widgetRes.widget);
        }
      } else {
        // No rooms yet - prompt to connect or auto-create a starting canvas
        const defaultWidget: WidgetPayload = {
          roomId: '',
          roomName: 'Doodlix Canvas',
          friendName: 'Connect a Friend',
          friendInitials: 'DX',
          lastUpdated: new Date().toISOString(),
          lastUpdatedFormatted: 'Tap to connect',
          strokesCount: 0,
          theme: 'lavender',
          size: selectedSize,
          isConnected: false,
          deepLinkUrl: 'doodlix://connect',
        };
        setWidgetPayload(defaultWidget);
      }
    } catch (err: any) {
      console.warn('Error loading home data:', err.message);
    }
  }, [selectedSize]);

  useEffect(() => {
    loadData();

    // Listen for live widget updates over Socket.IO
    const unsubscribeRefresh = socketService.onWidgetRefresh(() => {
      loadData();
    });

    return () => {
      unsubscribeRefresh();
    };
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenCanvas = () => {
    if (!activeRoom) {
      navigation.navigate('Connect');
    } else {
      navigation.navigate('Drawing', {
        roomId: activeRoom.roomId,
        roomName: activeRoom.name,
        friendName: widgetPayload.friendName,
        friendInitials: widgetPayload.friendInitials,
        initialStrokes: latestStrokes,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF9FF" />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>Doodlix</Text>
          <View style={styles.badgeWidgetFirst}>
            <Text style={styles.badgeWidgetFirstText}>WIDGET</Text>
          </View>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('FriendsList')}
          >
            <Text style={styles.iconBtnText}>👥</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('WidgetSettings')}
          >
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.iconBtnText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Main Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.mainHeading}>Your Doodlix Widget</Text>
          <Text style={styles.subHeading}>
            What appears on your phone's home screen right now.
          </Text>
        </View>

        {/* Widget Size Selector Pills */}
        <View style={styles.sizeSelectorRow}>
          {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => (
            <TouchableOpacity
              key={sz}
              style={[styles.sizePill, selectedSize === sz && styles.sizePillActive]}
              onPress={() => setSelectedSize(sz)}
            >
              <Text style={[styles.sizePillText, selectedSize === sz && styles.sizePillTextActive]}>
                {sz.charAt(0).toUpperCase() + sz.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}

          {/* OS Switcher Toggle (iPhone / Android) */}
          <TouchableOpacity
            style={styles.platformToggle}
            onPress={() => setPlatformMockup(platformMockup === 'ios' ? 'android' : 'ios')}
          >
            <Text style={styles.platformToggleText}>
              {platformMockup === 'ios' ? '🍏 iPhone' : '🤖 Android'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Widget Preview Box */}
        <View style={styles.previewContainer}>
          <WidgetPreview
            payload={widgetPayload}
            strokes={latestStrokes}
            size={selectedSize}
            theme={selectedTheme}
            platformMockup={platformMockup}
            onPressCanvas={handleOpenCanvas}
          />
        </View>

        {/* Primary Draw Action */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.drawCtaButton}
          onPress={handleOpenCanvas}
        >
          <Text style={styles.drawCtaText}>
            {activeRoom ? '✏️ Tap to Draw on Friend’s Screen' : '🤝 Connect with Friend First'}
          </Text>
        </TouchableOpacity>

        {/* Connection Status Card */}
        {activeRoom ? (
          <View style={styles.connectionCard}>
            <View style={styles.connectionRow}>
              <View style={[styles.avatarBadge, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.avatarBadgeText}>{widgetPayload.friendInitials}</Text>
              </View>
              <View style={styles.connectionInfo}>
                <Text style={styles.connectionName}>{widgetPayload.friendName}</Text>
                <Text style={styles.connectionMeta}>
                  Room: {activeRoom.name} • Code: {activeRoom.inviteCode}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.inviteShareBtn}
                onPress={() => navigation.navigate('Connect', { activeRoom })}
              >
                <Text style={styles.inviteShareBtnText}>Pair</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.noFriendCard}
            onPress={() => navigation.navigate('Connect')}
          >
            <Text style={styles.noFriendEmoji}>💌</Text>
            <View style={styles.noFriendInfo}>
              <Text style={styles.noFriendTitle}>No Friend Connected Yet</Text>
              <Text style={styles.noFriendSub}>Tap here to share an invite code or scan a QR code.</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Add to Home Screen Instructions Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.guideCard}
          onPress={() => navigation.navigate('WidgetSetupGuide')}
        >
          <View style={styles.guideCardIcon}>
            <Text style={styles.guideCardEmoji}>📌</Text>
          </View>
          <View style={styles.guideCardContent}>
            <Text style={styles.guideCardTitle}>How to add the Doodlix Widget</Text>
            <Text style={styles.guideCardSub}>
              Interactive step-by-step setup guide for {Platform.OS === 'ios' ? 'iPhone' : 'Android'}.
            </Text>
          </View>
          <Text style={styles.guideCardArrow}>›</Text>
        </TouchableOpacity>

        {/* Recent Doodles Timeline Preview */}
        {recentDrawings.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Recent Shared Doodles</Text>
              <TouchableOpacity onPress={() => navigation.navigate('DrawingHistory', { roomId: activeRoom?.roomId })}>
                <Text style={styles.historyViewAll}>View all ›</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
              {recentDrawings.map((d, index) => (
                <View key={d.drawingId || index} style={styles.historyThumbCard}>
                  <Text style={styles.historyAuthor}>{d.authorName}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(d.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </ScrollView>
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
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEAFE',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  badgeWidgetFirst: {
    backgroundColor: COLORS.lavender,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  badgeWidgetFirstText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEAFE',
  },
  iconBtnText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  subHeading: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sizeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  sizePill: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E8E5F5',
  },
  sizePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sizePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sizePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  platformToggle: {
    backgroundColor: '#F4F2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#D6D1EE',
  },
  platformToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  drawCtaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
  },
  drawCtaText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarBadgeText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  connectionMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inviteShareBtn: {
    backgroundColor: '#F4F2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#D6D1EE',
  },
  inviteShareBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  noFriendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  noFriendEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  noFriendInfo: {
    flex: 1,
  },
  noFriendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  noFriendSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  guideCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guideCardEmoji: {
    fontSize: 20,
  },
  guideCardContent: {
    flex: 1,
  },
  guideCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  guideCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  guideCardArrow: {
    fontSize: 20,
    color: '#A09CB8',
    marginLeft: 8,
  },
  historySection: {
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  historyViewAll: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  historyScroll: {
    flexDirection: 'row',
  },
  historyThumbCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    width: 110,
  },
  historyAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

