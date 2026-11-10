import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { StrokeRenderer } from './StrokeRenderer';
import { WidgetPayload, WidgetSize, WidgetTheme, Stroke } from '../shared/types';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface WidgetPreviewProps {
  payload: WidgetPayload;
  strokes?: Stroke[];
  size?: WidgetSize;
  theme?: WidgetTheme;
  platformMockup?: 'ios' | 'android';
  onPressCanvas?: () => void;
  style?: any;
}

export const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  payload,
  strokes = [],
  size = 'medium',
  theme = 'lavender',
  platformMockup = Platform.OS === 'android' ? 'android' : 'ios',
  onPressCanvas,
  style,
}) => {
  const getThemeBg = (t: WidgetTheme) => {
    switch (t) {
      case 'soft-pink':
        return '#FFF0F5';
      case 'purple':
        return '#EEEAFE';
      case 'midnight-dark':
        return '#1E1B2E';
      case 'minimal-light':
        return '#FFFFFF';
      default:
        return '#EEEAFE'; // Lavender default
    }
  };

  const isDark = theme === 'midnight-dark';
  const textColor = isDark ? '#FFFFFF' : COLORS.text;
  const mutedTextColor = isDark ? '#A09CB8' : COLORS.textSecondary;
  const cardBg = isDark ? '#28243C' : '#FFFFFF';
  const widgetBg = getThemeBg(theme);

  // Render Small Widget
  if (size === 'small') {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPressCanvas}
        style={[
          styles.widgetContainer,
          styles.smallWidget,
          { backgroundColor: widgetBg },
          platformMockup === 'ios' ? styles.iosCorner : styles.androidCorner,
          style,
        ]}
      >
        {/* Header */}
        <View style={styles.smallHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#7665E8' : COLORS.lavenderMuted }]}>
            <Text style={[styles.avatarText, { color: isDark ? '#FFF' : COLORS.primary }]}>
              {payload.friendInitials || 'DX'}
            </Text>
          </View>
          <Text style={[styles.brandLabel, { color: COLORS.primary }]}>Doodlix</Text>
        </View>

        {/* Canvas Area */}
        <View style={[styles.smallCanvasCard, { backgroundColor: cardBg }]}>
          {strokes.length > 0 ? (
            <StrokeRenderer
              strokes={strokes}
              width={124}
              height={84}
              backgroundColor={cardBg}
            />
          ) : (
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyEmoji}>✏️</Text>
              <Text style={[styles.emptyText, { color: mutedTextColor }]}>Tap to draw</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.smallFooter}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: payload.isConnected ? COLORS.success : COLORS.warning },
            ]}
          />
          <Text style={[styles.footerText, { color: mutedTextColor }]} numberOfLines={1}>
            {payload.lastUpdatedFormatted || 'Just now'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Render Medium Widget
  if (size === 'medium') {
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPressCanvas}
        style={[
          styles.widgetContainer,
          styles.mediumWidget,
          { backgroundColor: widgetBg },
          platformMockup === 'ios' ? styles.iosCorner : styles.androidCorner,
          style,
        ]}
      >
        {/* Left Drawing Canvas (Square) */}
        <View style={[styles.mediumCanvasCard, { backgroundColor: cardBg }]}>
          {strokes.length > 0 ? (
            <StrokeRenderer
              strokes={strokes}
              width={124}
              height={124}
              backgroundColor={cardBg}
            />
          ) : (
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyEmoji}>🎨</Text>
              <Text style={[styles.emptyText, { color: mutedTextColor }]}>Empty Canvas</Text>
            </View>
          )}
        </View>

        {/* Right Info & Action */}
        <View style={styles.mediumInfoCol}>
          <View style={styles.mediumHeader}>
            <View style={[styles.mediumAvatarCircle, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.mediumAvatarText}>{payload.friendInitials || 'TB'}</Text>
            </View>
            <View style={styles.friendTextWrapper}>
              <Text style={[styles.friendNameText, { color: textColor }]} numberOfLines={1}>
                {payload.friendName || 'Taylor (Person B)'}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: payload.isConnected ? COLORS.success : COLORS.warning },
                  ]}
                />
                <Text
                  style={[
                    styles.connectionStatusText,
                    { color: payload.isConnected ? COLORS.success : COLORS.warning },
                  ]}
                >
                  {payload.isConnected ? 'Connected' : 'Waiting for friend'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.mediumSpacer} />

          {/* Sync status */}
          <Text style={[styles.syncStatusText, { color: mutedTextColor }]}>
            🔄 Synced {payload.lastUpdatedFormatted || 'just now'}
          </Text>

          {/* Action CTA */}
          <View style={styles.openCanvasButton}>
            <Text style={styles.openCanvasText}>✏️ Open Canvas</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Render Large Widget
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPressCanvas}
      style={[
        styles.widgetContainer,
        styles.largeWidget,
        { backgroundColor: widgetBg },
        platformMockup === 'ios' ? styles.iosCorner : styles.androidCorner,
        style,
      ]}
    >
      {/* Top Header */}
      <View style={styles.largeHeader}>
        <View style={[styles.largeAvatarCircle, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.largeAvatarText}>{payload.friendInitials || 'TB'}</Text>
        </View>
        <View style={styles.largeHeaderInfo}>
          <Text style={[styles.largeFriendName, { color: textColor }]}>
            {payload.friendName || 'Taylor (Person B)'}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: payload.isConnected ? COLORS.success : COLORS.warning },
              ]}
            />
            <Text style={[styles.largeStatusText, { color: mutedTextColor }]}>
              {payload.isConnected ? 'Live Sync Active' : 'Waiting for connection'}
            </Text>
          </View>
        </View>
        <Text style={[styles.largeBrandText, { color: COLORS.primary }]}>Doodlix</Text>
      </View>

      {/* Large Canvas View */}
      <View style={[styles.largeCanvasCard, { backgroundColor: cardBg }]}>
        {strokes.length > 0 ? (
          <StrokeRenderer
            strokes={strokes}
            width={280}
            height={200}
            backgroundColor={cardBg}
          />
        ) : (
          <View style={styles.largeEmptyPlaceholder}>
            <Text style={styles.largeEmptyEmoji}>✨</Text>
            <Text style={[styles.largeEmptyTitle, { color: textColor }]}>Your shared canvas is ready</Text>
            <Text style={[styles.largeEmptySub, { color: mutedTextColor }]}>
              Tap anywhere to send a drawing to {payload.friendName || 'your friend'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Footer */}
      <View style={styles.largeFooter}>
        <Text style={[styles.largeSyncTime, { color: mutedTextColor }]}>
          Updated {payload.lastUpdatedFormatted || 'just now'}
        </Text>
        <View style={styles.largeDrawButton}>
          <Text style={styles.largeDrawButtonText}>🎨 Draw Together</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D6D1EE',
    ...SHADOWS.md,
  },
  iosCorner: {
    borderRadius: 24,
  },
  androidCorner: {
    borderRadius: 18,
  },

  // Small
  smallWidget: {
    width: 154,
    height: 154,
    padding: 12,
    justifyContent: 'space-between',
  },
  smallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
  },
  brandLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  smallCanvasCard: {
    flex: 1,
    borderRadius: 10,
    marginVertical: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5F5',
  },
  emptyPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 9,
    fontWeight: '500',
  },
  smallFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  footerText: {
    fontSize: 9,
    fontWeight: '400',
  },

  // Medium
  mediumWidget: {
    width: '100%',
    maxWidth: 340,
    height: 154,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediumCanvasCard: {
    width: 126,
    height: 126,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5F5',
    ...SHADOWS.sm,
  },
  mediumInfoCol: {
    flex: 1,
    marginLeft: 12,
    height: '100%',
    justifyContent: 'space-between',
  },
  mediumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediumAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  mediumAvatarText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  friendTextWrapper: {
    flex: 1,
  },
  friendNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  connectionStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  mediumSpacer: {
    flex: 1,
  },
  syncStatusText: {
    fontSize: 10,
    marginBottom: 6,
  },
  openCanvasButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  openCanvasText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Large
  largeWidget: {
    width: '100%',
    maxWidth: 340,
    height: 330,
    padding: 16,
    justifyContent: 'space-between',
  },
  largeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  largeAvatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  largeHeaderInfo: {
    flex: 1,
  },
  largeFriendName: {
    fontSize: 14,
    fontWeight: '700',
  },
  largeStatusText: {
    fontSize: 11,
  },
  largeBrandText: {
    fontSize: 12,
    fontWeight: '900',
  },
  largeCanvasCard: {
    flex: 1,
    borderRadius: 16,
    marginVertical: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5F5',
    ...SHADOWS.sm,
  },
  largeEmptyPlaceholder: {
    alignItems: 'center',
    padding: 16,
  },
  largeEmptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  largeEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  largeEmptySub: {
    fontSize: 11,
    textAlign: 'center',
  },
  largeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeSyncTime: {
    fontSize: 11,
  },
  largeDrawButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
  },
  largeDrawButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

