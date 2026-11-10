import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../services/dataStore.js';
import { strokeEngine } from '../services/strokeEngine.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getLatestDrawing(req: AuthRequest, res: Response): Promise<void> {
  try {
    const roomId = req.params.roomId as string;
    const room = await dataStore.findRoomById(roomId);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    const latest = await dataStore.getLatestDrawingForRoom(roomId);
    const activeStrokes = strokeEngine.getRoomStrokes(roomId);

    res.status(200).json({
      success: true,
      drawing: latest || {
        drawingId: `initial_${roomId}`,
        roomId,
        authorId: room.ownerId,
        authorName: room.members[0]?.username || 'Doodler',
        strokes: activeStrokes,
        snapshotUrl: room.latestSnapshotUrl || '',
        updatedAt: room.updatedAt
      },
      activeStrokes
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error fetching drawing.' });
  }
}

export async function saveDrawing(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    const { strokes, customSnapshotUrl } = req.body;

    const room = await dataStore.findRoomById(roomId);
    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    // Verify user is a member
    const isMember = room.members.some((m: any) => m.userId === req.user!.userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'You are not a member of this drawing room.' });
      return;
    }

    const userStrokes = strokes || strokeEngine.getRoomStrokes(roomId);
    strokeEngine.loadRoomStrokes(roomId, userStrokes);

    // Generate crisp SVG snapshot data URL
    const svg = strokeEngine.generateSvgSnapshot(userStrokes);
    const snapshotUrl = customSnapshotUrl || strokeEngine.generateDataUrl(svg);

    const drawingId = `draw_${uuidv4().substring(0, 12)}`;
    const now = new Date().toISOString();

    const saved = await dataStore.saveDrawing({
      drawingId,
      roomId,
      authorId: req.user.userId,
      authorName: req.user.username,
      strokes: userStrokes,
      snapshotUrl,
      updatedAt: now
    });

    res.status(200).json({
      success: true,
      message: 'Drawing saved and synced successfully!',
      drawing: saved
    });
  } catch (err: any) {
    console.error('Save drawing error:', err);
    res.status(500).json({ success: false, message: 'Server error saving drawing.' });
  }
}

export async function getDrawingHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const roomId = req.params.roomId as string;
    const limit = parseInt(req.query.limit as string) || 20;

    const history = await dataStore.getDrawingsHistoryForRoom(roomId, limit);
    res.status(200).json({
      success: true,
      history
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error fetching history.' });
  }
}

export async function clearCanvas(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    strokeEngine.clearCanvas(roomId);

    const svg = strokeEngine.generateSvgSnapshot([]);
    const snapshotUrl = strokeEngine.generateDataUrl(svg);

    const drawingId = `clear_${uuidv4().substring(0, 8)}`;
    await dataStore.saveDrawing({
      drawingId,
      roomId,
      authorId: req.user.userId,
      authorName: req.user.username,
      strokes: [],
      snapshotUrl,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Canvas cleared.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error clearing canvas.' });
  }
}
