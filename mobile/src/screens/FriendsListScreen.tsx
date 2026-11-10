import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import { widgetBridge } from '../services/widgetBridge';
import { Room } from '../shared/types';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface FriendsListScreenProps {
  navigation: any;
}

export const FriendsListScreen: React.FC<FriendsListScreenProps> = ({ navigation }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await api.getMyRooms();
      setRooms(res.rooms || []);
    } catch (err: any) {
      console.warn('Error fetching rooms:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWidgetRoom = async (room: Room) => {
    try {
      const widgetRes = await api.getWidgetDataForRoom(room.roomId);
      if (widgetRes.widget) {
        await widgetBridge.updateNativeWidget(widgetRes.widget);
      }
      Alert.alert('Widget Updated', `Home-screen widget is now displaying: ${room.name}`);
      navigation.navigate('Home');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDisconnect = (room: Room) => {
    Alert.alert(
      'Disconnect Friend',
      `Are you sure you want to disconnect from "${room.name}"? You will stop sharing home-screen doodles.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.leaveRoom(room.roomId);
              loadRooms();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connected Friends & Rooms</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('Connect')}
        >
          <Text style={styles.addBtnText}>+ Pair</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.roomId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No Friends Connected</Text>
              <Text style={styles.emptySub}>
                Connect with a friend to start exchanging live doodles on your home screens.
              </Text>
              <TouchableOpacity
                style={styles.connectNowBtn}
                onPress={() => navigation.navigate('Connect')}
              >
                <Text style={styles.connectNowBtnText}>Connect with Friend</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.roomCard}>
              <View style={styles.roomCardHeader}>
                <View style={styles.roomAvatar}>
                  <Text style={styles.roomAvatarText}>
                    {item.members[1]?.initials || item.members[0]?.initials || 'DX'}
                  </Text>
                </View>

                <View style={styles.roomDetails}>
                  <Text style={styles.roomTitle}>{item.name}</Text>
                  <Text style={styles.roomSub}>
                    {item.members.map((m) => m.username).join(' & ')}
                  </Text>
                  <Text style={styles.roomCode}>Invite Code: {item.inviteCode}</Text>
                </View>
              </View>

              <View style={styles.roomActions}>
                <TouchableOpacity
                  style={styles.setWidgetBtn}
                  onPress={() => handleSelectWidgetRoom(item)}
                >
                  <Text style={styles.setWidgetBtnText}>📱 Set Active on Widget</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.drawBtn}
                  onPress={() =>
                    navigation.navigate('Drawing', {
                      roomId: item.roomId,
                      roomName: item.name,
                      friendName: item.members[1]?.username || item.members[0]?.username,
                    })
                  }
                >
                  <Text style={styles.drawBtnText}>✏️ Draw</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.disconnectBtn}
                  onPress={() => handleDisconnect(item)}
                >
                  <Text style={styles.disconnectBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
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
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    ...SHADOWS.sm,
  },
  roomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  roomDetails: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  roomSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  roomCode: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 3,
  },
  roomActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F2FF',
    paddingTop: 10,
    alignItems: 'center',
  },
  setWidgetBtn: {
    flex: 2,
    backgroundColor: '#F4F2FF',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6D1EE',
  },
  setWidgetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  drawBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  drawBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  disconnectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFDCE8',
  },
  disconnectBtnText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  connectNowBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
  },
  connectNowBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

