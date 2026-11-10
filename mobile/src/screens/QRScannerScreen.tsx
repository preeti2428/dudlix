import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { COLORS, RADIUS, SHADOWS } from '../theme/theme';

interface QRScannerScreenProps {
  navigation: any;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConnectCode = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      // Clean deep link if scanned full url
      let cleanCode = code.trim();
      if (cleanCode.includes('/invite/')) {
        cleanCode = cleanCode.split('/invite/')[1];
      }

      const res = await api.joinRoomByInvite(cleanCode);
      Alert.alert('Connected!', 'Linked successfully to friend canvas!', [
        {
          text: 'Open Canvas',
          onPress: () => {
            navigation.navigate('Drawing', {
              roomId: res.room.roomId,
              roomName: res.room.name,
              friendName: res.room.members[0]?.username || 'Friend',
            });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message || 'Invalid QR code or invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Doodlix QR</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Viewfinder simulation */}
      <View style={styles.viewFinderArea}>
        <View style={styles.targetBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <Text style={styles.viewfinderHint}>Align friend's QR code within frame</Text>
        </View>
      </View>

      {/* Manual Input Fallback */}
      <View style={styles.bottomCard}>
        <Text style={styles.fallbackTitle}>Or Enter Code Manually</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="DLX-XXXXXX"
            placeholderTextColor="#A09CB8"
            value={manualCode}
            onChangeText={(t) => setManualCode(t.toUpperCase())}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => handleConnectCode(manualCode)}
            disabled={loading}
          >
            <Text style={styles.connectBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1B2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  placeholder: {
    width: 36,
  },
  viewFinderArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetBox: {
    width: 240,
    height: 240,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: COLORS.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  viewfinderHint: {
    color: '#EEEAFE',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomCard: {
    backgroundColor: '#28243C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  fallbackTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#1E1B2E',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  connectBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

