import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StrokeRenderer } from '../components/StrokeRenderer';
import { api } from '../services/api';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface DrawingHistoryScreenProps {
  navigation: any;
  route: any;
}

export const DrawingHistoryScreen: React.FC<DrawingHistoryScreenProps> = ({
  navigation,
  route,
}) => {
  const roomId = route.params?.roomId;
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [roomId]);

  const loadHistory = async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getDrawingHistory(roomId, 30);
      setHistory(res.history || []);
    } catch (err: any) {
      console.warn('Error loading history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (item: any) => {
    Alert.alert(
      'Restore Doodle',
      `Restore this doodle created by ${item.authorName} to your live shared canvas?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore to Canvas',
          onPress: () => {
            navigation.navigate('Drawing', {
              roomId,
              initialStrokes: item.strokes || [],
            });
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
        <Text style={styles.headerTitle}>Shared Doodle History</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.drawingId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyTitle}>No History Yet</Text>
              <Text style={styles.emptySub}>
                Every time you or your friend push a drawing to your widget, it will be saved here in your memories timeline.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.previewBox}>
                <StrokeRenderer
                  strokes={item.strokes || []}
                  width={140}
                  height={140}
                  backgroundColor="#FFFFFF"
                />
              </View>

              <View style={styles.detailsBox}>
                <Text style={styles.authorName}>Doodled by {item.authorName}</Text>
                <Text style={styles.timestamp}>
                  {new Date(item.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={styles.strokeCount}>
                  {item.strokes ? item.strokes.length : 0} vector strokes
                </Text>

                <TouchableOpacity
                  style={styles.restoreBtn}
                  onPress={() => handleRestore(item)}
                >
                  <Text style={styles.restoreBtnText}>↺ Open on Canvas</Text>
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
  placeholder: {
    width: 36,
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEAFE',
    ...SHADOWS.sm,
  },
  previewBox: {
    width: 140,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E5F5',
  },
  detailsBox: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    height: 130,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  strokeCount: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  restoreBtn: {
    backgroundColor: '#F4F2FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6D1EE',
  },
  restoreBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
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
  },
});

