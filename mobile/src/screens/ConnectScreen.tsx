import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../services/api';
import { Room } from '../shared/types';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface ConnectScreenProps {
  navigation: any;
  route: any;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ navigation, route }) => {
  const existingRoom = route.params?.activeRoom as Room | undefined;

  const [activeTab, setActiveTab] = useState<'invite' | 'join'>('invite');
  const [room, setRoom] = useState<Room | null>(existingRoom || null);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!room) {
      createOrFetchRoom();
    }
  }, []);

  const createOrFetchRoom = async () => {
    setLoading(true);
    try {
      const myRooms = await api.getMyRooms();
      if (myRooms.rooms && myRooms.rooms.length > 0) {
        setRoom(myRooms.rooms[0]);
      } else {
        const newRoomRes = await api.createRoom('Our Doodlix Canvas');
        setRoom(newRoomRes.room);
      }
    } catch (err: any) {
      console.warn('Error creating/fetching room:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const inviteCode = room?.inviteCode || 'DLX-DEMO';
  const shareableLink = `https://doodlix.app/invite/${inviteCode}`;

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Draw on my phone's home screen! Connect with me on Doodlix with invite code: ${inviteCode}\n${shareableLink}`,
        title: 'Connect on Doodlix',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinWithCode = async () => {
    if (!inputCode.trim()) {
      Alert.alert('Missing Code', 'Please enter a 6-character Doodlix invite code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.joinRoomByInvite(inputCode.trim());
      Alert.alert('Connected!', 'You are now connected! Your home-screen widget will show the shared canvas.', [
        {
          text: 'Start Drawing',
          onPress: () => {
            navigation.navigate('Drawing', {
              roomId: res.room.roomId,
              roomName: res.room.name,
              friendName: res.room.members[0]?.username || 'Friend',
            });
          },
        },
        {
          text: 'Go to Home',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Connection Failed', err.message || 'Invalid or expired invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect with Friend</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Mode Tabs: Share Invite vs Join Friend */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'invite' && styles.tabBtnActive]}
          onPress={() => setActiveTab('invite')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'invite' && styles.tabBtnTextActive]}>
            💌 Share My Invite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'join' && styles.tabBtnActive]}
          onPress={() => setActiveTab('join')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'join' && styles.tabBtnTextActive]}>
            🔗 Enter Code
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'invite' ? (
          <View style={styles.tabCard}>
            <Text style={styles.tabHeading}>Method 1: QR Code</Text>
            <Text style={styles.tabSub}>
              Have your friend scan this QR code with their camera or Doodlix app.
            </Text>

            {/* QR Code Container */}
            <View style={styles.qrContainer}>
              <QRCode
                value={shareableLink}
                size={160}
                color={COLORS.text}
                backgroundColor="#FFFFFF"
              />
            </View>

            {/* Method 2: 6-Digit Alphanumeric Code */}
            <Text style={[styles.tabHeading, { marginTop: 24 }]}>Method 2: 6-Digit Invite Code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{inviteCode}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                <Text style={styles.copyBtnText}>{copied ? '✓ Copied' : 'Copy'}</Text>
              </TouchableOpacity>
            </View>

            {/* Method 3: Shareable Invitation Link */}
            <Text style={[styles.tabHeading, { marginTop: 24 }]}>Method 3: Shareable Link</Text>
            <TouchableOpacity style={styles.shareLinkBtn} onPress={handleShareLink}>
              <Text style={styles.shareLinkBtnText}>📤 Send Link via WhatsApp / iMessage / SMS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tabCard}>
            <Text style={styles.tabHeading}>Enter Friend's Invite Code</Text>
            <Text style={styles.tabSub}>
              Paste the 6-character code (e.g. DLX-K94B27) sent by your friend.
            </Text>

            <TextInput
              style={styles.inputCode}
              placeholder="DLX-XXXXXX"
              placeholderTextColor="#A09CB8"
              value={inputCode}
              onChangeText={(txt) => setInputCode(txt.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.connectBtn}
              onPress={handleJoinWithCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.connectBtnText}>🤝 Connect & Link Widgets</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.scanQrBtn}
              onPress={() => navigation.navigate('QRScanner')}
            >
              <Text style={styles.scanQrBtnText}>📷 Scan Friend's QR Code</Text>
            </TouchableOpacity>
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
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  tabContainer: {
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
  tabCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    ...SHADOWS.md,
  },
  tabHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  tabSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 16,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FAF9FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEEAFE',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F2FF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D6D1EE',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.primary,
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  copyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  shareLinkBtn: {
    backgroundColor: '#F4F2FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6D1EE',
  },
  shareLinkBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputCode: {
    backgroundColor: '#FAF9FF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D6D1EE',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    color: COLORS.text,
    marginBottom: 16,
  },
  connectBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  connectBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEAFE',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  scanQrBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  scanQrBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});

