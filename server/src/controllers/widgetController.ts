import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore.js';
import { strokeEngine } from '../services/strokeEngine.js';
import { WidgetPayload, WidgetTheme, WidgetSize } from '../shared/types.js';

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function getWidgetDataForRoom(req: Request, res: Response): Promise<void> {
  try {
    const roomId = req.params.roomId as string;
    const forUserId = req.query.userId as string | undefined;

    const room = await dataStore.findRoomById(roomId);
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found for widget' });
      return;
    }

    // Determine the "friend" (the other member in a 2-person room, or the owner/other member)
    const otherMember = forUserId
      ? room.members.find((m: any) => m.userId !== forUserId) || room.members[0]
      : room.members[1] || room.members[0];

    const friendName = otherMember ? otherMember.username : 'Friend';
    const friendInitials = otherMember ? otherMember.initials : 'DX';

    // Get latest drawing
    const latestDrawing = await dataStore.getLatestDrawingForRoom(roomId);
    let strokes = latestDrawing?.strokes || strokeEngine.getRoomStrokes(roomId);
    let snapshotUrl = latestDrawing?.snapshotUrl || room.latestSnapshotUrl;

    if (!snapshotUrl && strokes.length > 0) {
      const svg = strokeEngine.generateSvgSnapshot(strokes);
      snapshotUrl = strokeEngine.generateDataUrl(svg);
    }

    // Get preferences if available
    const prefs = forUserId ? await dataStore.getWidgetPreference(forUserId, roomId) : null;
    const theme: WidgetTheme = prefs?.theme || 'lavender';
    const size: WidgetSize = prefs?.widgetSize || 'medium';

    const payload: WidgetPayload = {
      roomId: room.roomId,
      roomName: room.name,
      friendName,
      friendInitials,
      lastUpdated: room.updatedAt,
      lastUpdatedFormatted: formatRelativeTime(room.updatedAt),
      drawingSnapshotUrl: snapshotUrl || '',
      strokesCount: strokes.length,
      theme,
      size,
      isConnected: room.members.length >= 2,
      deepLinkUrl: `doodlix://draw/${room.roomId}`
    };

    res.status(200).json({
      success: true,
      widget: payload
    });
  } catch (err: any) {
    console.error('Widget data error:', err);
    res.status(500).json({ success: false, message: 'Server error generating widget payload.' });
  }
}

export async function getWidgetDataForUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;

    const rooms = await dataStore.findRoomsForUser(userId);
    if (!rooms || rooms.length === 0) {
      // Return beautiful default empty state for widget
      res.status(200).json({
        success: true,
        widget: {
          roomId: '',
          roomName: 'Doodlix',
          friendName: 'Connect Friend',
          friendInitials: 'DX',
          lastUpdated: new Date().toISOString(),
          lastUpdatedFormatted: 'Tap to connect',
          drawingSnapshotUrl: '',
          strokesCount: 0,
          theme: 'lavender' as WidgetTheme,
          size: 'medium' as WidgetSize,
          isConnected: false,
          deepLinkUrl: 'doodlix://connect'
        }
      });
      return;
    }

    const activeRoom = rooms[0];
    req.params.roomId = activeRoom.roomId;
    req.query.userId = userId;
    return getWidgetDataForRoom(req, res);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error generating user widget.' });
  }
}

export async function getWidgetSvgImage(req: Request, res: Response): Promise<void> {
  try {
    const roomId = req.params.roomId as string;
    const themeBg = (req.query.bg as string) || '#FAF9FF';

    const latest = await dataStore.getLatestDrawingForRoom(roomId);
    const strokes = latest?.strokes || strokeEngine.getRoomStrokes(roomId);

    const svg = strokeEngine.generateSvgSnapshot(strokes, 400, 400, themeBg);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=15'); // short cache for widget reload
    res.send(svg);
  } catch (err: any) {
    res.status(500).send('<svg></svg>');
  }
}

export async function saveWidgetPreferences(req: Request, res: Response): Promise<void> {
  try {
    const { userId, roomId, widgetSize, theme, previewStyle } = req.body;
    if (!userId || !roomId) {
      res.status(400).json({ success: false, message: 'userId and roomId are required.' });
      return;
    }

    const saved = await dataStore.setWidgetPreference({
      userId,
      roomId,
      widgetSize: widgetSize || 'medium',
      theme: theme || 'lavender',
      previewStyle: previewStyle || 'paper',
      lastSyncedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      preferences: saved
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error saving preferences.' });
  }
}

export async function getWidgetPreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const roomId = req.query.roomId as string | undefined;

    const prefs = await dataStore.getWidgetPreference(userId, roomId);
    res.status(200).json({
      success: true,
      preferences: prefs || {
        userId,
        roomId: roomId || '',
        widgetSize: 'medium',
        theme: 'lavender',
        previewStyle: 'paper',
        lastSyncedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error fetching preferences.' });
  }
}
