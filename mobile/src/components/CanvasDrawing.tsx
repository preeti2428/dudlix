import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { StrokeRenderer } from './StrokeRenderer';
import { socketService } from '../services/socket';
import { Stroke, Point } from '../shared/types';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';

interface CanvasDrawingProps {
  roomId: string;
  initialStrokes?: Stroke[];
  onSaveToWidget?: (strokes: Stroke[]) => void;
  partnerName?: string;
  partnerInitials?: string;
  isPartnerOnline?: boolean;
}

export const CanvasDrawing: React.FC<CanvasDrawingProps> = ({
  roomId,
  initialStrokes = [],
  onSaveToWidget,
  partnerName = 'Friend',
  partnerInitials = 'TB',
  isPartnerOnline = false,
}) => {
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [undoneStrokes, setUndoneStrokes] = useState<Stroke[]>([]);
  const [currentTool, setCurrentTool] = useState<'pen' | 'pencil' | 'eraser'>('pen');
  const [selectedColor, setSelectedColor] = useState<string>(COLORS.palette[0]);
  const [brushSize, setBrushSize] = useState<number>(6);
  const [isDrawing, setIsDrawing] = useState(false);
  const [partnerActiveDrawing, setPartnerActiveDrawing] = useState(false);

  // Canvas layout dimensions
  const [canvasLayout, setCanvasLayout] = useState({ width: 340, height: 340 });

  // Refs for smooth high-speed gesture capture
  const strokesRef = useRef<Stroke[]>(strokes);
  strokesRef.current = strokes;

  const currentStrokeRef = useRef<Stroke | null>(null);
  const partnerStrokeTimeoutRef = useRef<any>(null);

  // Sync initial strokes if they update
  useEffect(() => {
    if (initialStrokes && initialStrokes.length > 0) {
      setStrokes(initialStrokes);
    }
  }, [initialStrokes]);

  // Setup real-time Socket.IO listeners
  useEffect(() => {
    // 1. Join room
    socketService.joinRoom(roomId);

    // 2. Peer stroke live streaming
    const unsubscribeMove = socketService.onStrokeMove(({ stroke }) => {
      setPartnerActiveDrawing(true);
      if (partnerStrokeTimeoutRef.current) clearTimeout(partnerStrokeTimeoutRef.current);
      partnerStrokeTimeoutRef.current = setTimeout(() => {
        setPartnerActiveDrawing(false);
      }, 1000);
    });

    // 3. Peer completed stroke
    const unsubscribeEnd = socketService.onStrokeEnd((stroke) => {
      setPartnerActiveDrawing(false);
      setStrokes((prev) => {
        // Prevent duplicate strokes
        if (prev.some((s) => s.id === stroke.id)) return prev;
        return [...prev, stroke];
      });
    });

    // 4. Remote undo
    const unsubscribeUndo = socketService.onCanvasUndo((data) => {
      setStrokes((prev) => prev.filter((s) => s.id !== data.strokeId));
    });

    // 5. Remote redo
    const unsubscribeRedo = socketService.onCanvasRedo((data) => {
      if (data.stroke) {
        setStrokes((prev) => [...prev, data.stroke]);
      }
    });

    // 6. Remote clear
    const unsubscribeClear = socketService.onCanvasClear(() => {
      setStrokes([]);
      setUndoneStrokes([]);
    });

    // 7. Full canvas sync
    const unsubscribeSync = socketService.onCanvasSync((syncedStrokes) => {
      if (syncedStrokes && syncedStrokes.length > 0) {
        setStrokes(syncedStrokes);
      }
    });

    return () => {
      unsubscribeMove();
      unsubscribeEnd();
      unsubscribeUndo();
      unsubscribeRedo();
      unsubscribeClear();
      unsubscribeSync();
      if (partnerStrokeTimeoutRef.current) clearTimeout(partnerStrokeTimeoutRef.current);
    };
  }, [roomId]);

  // PanResponder for smooth vector touch capture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        // Map native coordinates to canonical 400x400 space
        const canonicalX = (locationX / canvasLayout.width) * 400;
        const canonicalY = (locationY / canvasLayout.height) * 400;

        const newStroke: Stroke = {
          id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: 'me',
          color: selectedColor,
          size: brushSize,
          tool: currentTool,
          opacity: currentTool === 'pencil' ? 0.75 : 1,
          points: [{ x: canonicalX, y: canonicalY, timestamp: Date.now() }],
          createdAt: Date.now(),
        };

        currentStrokeRef.current = newStroke;
        setIsDrawing(true);
        setStrokes((prev) => [...prev, newStroke]);
        socketService.emitStrokeMove(roomId, newStroke);
      },

      onPanResponderMove: (evt) => {
        if (!currentStrokeRef.current) return;
        const { locationX, locationY } = evt.nativeEvent;

        const canonicalX = Math.max(0, Math.min(400, (locationX / canvasLayout.width) * 400));
        const canonicalY = Math.max(0, Math.min(400, (locationY / canvasLayout.height) * 400));

        const updatedStroke: Stroke = {
          ...currentStrokeRef.current,
          points: [
            ...currentStrokeRef.current.points,
            { x: canonicalX, y: canonicalY, timestamp: Date.now() },
          ],
        };

        currentStrokeRef.current = updatedStroke;

        // Update active stroke in state
        setStrokes((prev) => {
          const next = [...prev];
          next[next.length - 1] = updatedStroke;
          return next;
        });

        // Broadcast points stream to partner
        socketService.emitStrokeMove(roomId, updatedStroke);
      },

      onPanResponderRelease: () => {
        if (!currentStrokeRef.current) return;
        const completedStroke = currentStrokeRef.current;
        currentStrokeRef.current = null;
        setIsDrawing(false);

        // Notify socket of finished stroke
        socketService.emitStrokeEnd(roomId, completedStroke);
        // Clear redo stack on new stroke
        setUndoneStrokes([]);
      },
    })
  ).current;

  // Actions: Undo, Redo, Clear
  const handleUndo = useCallback(() => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setUndoneStrokes((prev) => [...prev, last]);
    socketService.emitUndo(roomId);
  }, [strokes, roomId]);

  const handleRedo = useCallback(() => {
    if (undoneStrokes.length === 0) return;
    const restored = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes((prev) => prev.slice(0, prev.length - 1));
    setStrokes((prev) => [...prev, restored]);
    socketService.emitRedo(roomId);
  }, [undoneStrokes, roomId]);

  const handleClear = useCallback(() => {
    if (strokes.length === 0) return;
    Alert.alert('Clear Canvas', 'Are you sure you want to clear the shared drawing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setStrokes([]);
          setUndoneStrokes([]);
          socketService.emitClear(roomId);
        },
      },
    ]);
  }, [strokes, roomId]);

  const handleSaveToWidget = () => {
    if (onSaveToWidget) {
      onSaveToWidget(strokesRef.current);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar: Friend Presence & Widget Push Action */}
      <View style={styles.topBar}>
        <View style={styles.partnerInfo}>
          <View style={[styles.partnerAvatar, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.partnerAvatarText}>{partnerInitials}</Text>
          </View>
          <View>
            <Text style={styles.partnerNameText}>{partnerName}</Text>
            <View style={styles.liveStatusRow}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: isPartnerOnline || partnerActiveDrawing ? COLORS.success : '#A09CB8' },
                ]}
              />
              <Text style={styles.liveStatusLabel}>
                {partnerActiveDrawing
                  ? 'Drawing right now...'
                  : isPartnerOnline
                  ? 'In room'
                  : 'Widget connected'}
              </Text>
            </View>
          </View>
        </View>

        {/* Push to Widget Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.pushWidgetButton}
          onPress={handleSaveToWidget}
        >
          <Text style={styles.pushWidgetButtonText}>📱 Push to Widget</Text>
        </TouchableOpacity>
      </View>

      {/* Main Vector Drawing Canvas */}
      <View
        style={styles.canvasWrapper}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setCanvasLayout({ width, height });
        }}
        {...panResponder.panHandlers}
      >
        <StrokeRenderer
          strokes={strokes}
          width={canvasLayout.width}
          height={canvasLayout.height}
          backgroundColor="#FFFFFF"
        />

        {strokes.length === 0 && !isDrawing && (
          <View style={styles.canvasEmptyState} pointerEvents="none">
            <Text style={styles.canvasEmptyEmoji}>✨</Text>
            <Text style={styles.canvasEmptyTitle}>Draw with {partnerName}</Text>
            <Text style={styles.canvasEmptySub}>Use your finger to draw. Updates appear on your home-screen widget.</Text>
          </View>
        )}
      </View>

      {/* Drawing Toolbar */}
      <View style={styles.toolbarCard}>
        {/* Row 1: Tool Picker (Pen, Pencil, Eraser) & Canvas Controls (Undo, Redo, Clear) */}
        <View style={styles.toolRow}>
          <View style={styles.toolGroup}>
            <TouchableOpacity
              style={[styles.toolBtn, currentTool === 'pen' && styles.toolBtnActive]}
              onPress={() => setCurrentTool('pen')}
            >
              <Text style={[styles.toolBtnText, currentTool === 'pen' && styles.toolBtnTextActive]}>
                🖊️ Pen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, currentTool === 'pencil' && styles.toolBtnActive]}
              onPress={() => setCurrentTool('pencil')}
            >
              <Text style={[styles.toolBtnText, currentTool === 'pencil' && styles.toolBtnTextActive]}>
                ✏️ Pencil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, currentTool === 'eraser' && styles.toolBtnActive]}
              onPress={() => setCurrentTool('eraser')}
            >
              <Text style={[styles.toolBtnText, currentTool === 'eraser' && styles.toolBtnTextActive]}>
                🧹 Eraser
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={[styles.actionBtn, strokes.length === 0 && styles.btnDisabled]}
              onPress={handleUndo}
              disabled={strokes.length === 0}
            >
              <Text style={styles.actionBtnText}>↩️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, undoneStrokes.length === 0 && styles.btnDisabled]}
              onPress={handleRedo}
              disabled={undoneStrokes.length === 0}
            >
              <Text style={styles.actionBtnText}>↪️</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, strokes.length === 0 && styles.btnDisabled]}
              onPress={handleClear}
              disabled={strokes.length === 0}
            >
              <Text style={styles.actionBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: Brush Sizes */}
        <View style={styles.brushSizeRow}>
          <Text style={styles.sectionLabel}>Size:</Text>
          {[3, 6, 12, 20, 30].map((sz) => (
            <TouchableOpacity
              key={sz}
              style={[styles.sizeCircleWrapper, brushSize === sz && styles.sizeCircleActive]}
              onPress={() => setBrushSize(sz)}
            >
              <View
                style={[
                  styles.sizeCircleDot,
                  {
                    width: Math.min(20, Math.max(6, sz * 0.7)),
                    height: Math.min(20, Math.max(6, sz * 0.7)),
                    backgroundColor: currentTool === 'eraser' ? '#A09CB8' : selectedColor,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 3: Color Palette (Hidden when eraser selected) */}
        {currentTool !== 'eraser' && (
          <View style={styles.colorRow}>
            {COLORS.palette.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorSwatchSelected,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  partnerAvatarText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  partnerNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  liveStatusLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  pushWidgetButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  pushWidgetButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Canvas
  canvasWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E8E5F5',
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.md,
  },
  canvasEmptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  canvasEmptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  canvasEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  canvasEmptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Toolbar
  toolbarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EEEAFE',
    ...SHADOWS.sm,
  },
  toolRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolGroup: {
    flexDirection: 'row',
    backgroundColor: '#F4F2FF',
    borderRadius: 12,
    padding: 3,
  },
  toolBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  toolBtnActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.sm,
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toolBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.35,
  },

  // Brush Size
  brushSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F2FF',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 10,
  },
  sizeCircleWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sizeCircleActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  sizeCircleDot: {
    borderRadius: 20,
  },

  // Color Palette
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4F2FF',
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
    ...SHADOWS.md,
  },
});

