import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { strokeEngine } from '../services/strokeEngine.js';
import { dataStore } from '../services/dataStore.js';
import { SOCKET_EVENTS, Stroke } from '../shared/types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'doodlix-secret-key-2026-production';

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    username: string;
    email: string;
  };
}

export function setupDrawingSocket(io: Server): void {
  // Authentication middleware for socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Allow demo or anonymous guests if token is absent, or check if guest
      const guestId = socket.handshake.auth?.guestId || `guest_${socket.id.substring(0, 5)}`;
      const guestName = socket.handshake.auth?.guestName || 'Doodler';
      socket.user = {
        userId: guestId,
        username: guestName,
        email: `${guestId}@doodlix.local`
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        username: string;
        email: string;
      };
      socket.user = decoded;
      next();
    } catch (err) {
      // Fallback to guest so connection isn't severed in dev
      socket.user = {
        userId: `guest_${socket.id.substring(0, 5)}`,
        username: 'Guest Doodler',
        email: 'guest@doodlix.local'
      };
      next();
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`🔌 [Socket] Connected: ${user.username} (${user.userId}) [${socket.id}]`);

    let currentRoomId: string | null = null;

    // Join Room
    socket.on(SOCKET_EVENTS.JOIN_ROOM, async ({ roomId }: { roomId: string }, ack?: Function) => {
      try {
        if (!roomId) return;

        // Leave previous room if any
        if (currentRoomId) {
          socket.leave(currentRoomId);
          io.to(currentRoomId).emit(SOCKET_EVENTS.ROOM_USER_LEFT, {
            userId: user.userId,
            username: user.username
          });
        }

        // Validate room exists
        const room = await dataStore.findRoomById(roomId);
        if (!room) {
          if (ack) ack({ success: false, message: 'Room does not exist' });
          return;
        }

        // If user is not yet recorded as a member, add them
        const isMember = room.members.some((m: any) => m.userId === user.userId);
        if (!isMember) {
          await dataStore.addMemberToRoom(roomId, {
            userId: user.userId,
            username: user.username,
            initials: user.username.slice(0, 2).toUpperCase(),
            joinedAt: new Date().toISOString()
          });
        }

        currentRoomId = roomId;
        socket.join(roomId);

        // Load existing room strokes into memory if needed
        let existingStrokes = strokeEngine.getRoomStrokes(roomId);
        if (existingStrokes.length === 0) {
          const latestDbDrawing = await dataStore.getLatestDrawingForRoom(roomId);
          if (latestDbDrawing && latestDbDrawing.strokes.length > 0) {
            strokeEngine.loadRoomStrokes(roomId, latestDbDrawing.strokes);
            existingStrokes = latestDbDrawing.strokes;
          }
        }

        // Notify room members
        io.to(roomId).emit(SOCKET_EVENTS.ROOM_USER_JOINED, {
          userId: user.userId,
          username: user.username,
          timestamp: Date.now()
        });

        // Send current canvas state directly back to the joining user
        socket.emit(SOCKET_EVENTS.CANVAS_SYNC_RESPONSE, {
          roomId,
          strokes: existingStrokes,
          timestamp: Date.now()
        });

        if (ack) ack({ success: true, roomId, strokesCount: existingStrokes.length });
        console.log(`🎨 [Socket] ${user.username} joined room ${roomId}`);
      } catch (err) {
        console.error('Error joining room socket:', err);
        if (ack) ack({ success: false, message: 'Error joining room' });
      }
    });

    // Real-time Stroke Movement / Points Streaming
    socket.on(SOCKET_EVENTS.STROKE_MOVE, (data: { roomId: string; stroke: Stroke }) => {
      if (!data.roomId) return;
      // Broadcast point stream to all other clients in the room for instant low-latency live rendering
      socket.to(data.roomId).emit(SOCKET_EVENTS.STROKE_MOVE, data);
    });

    // Stroke End / Completion
    socket.on(SOCKET_EVENTS.STROKE_END, async (data: { roomId: string; stroke: Stroke }, ack?: Function) => {
      try {
        if (!data.roomId || !data.stroke) return;

        // Record stroke in engine
        const savedStroke = strokeEngine.addStroke(data.roomId, data.stroke);

        // Broadcast to other peers
        socket.to(data.roomId).emit(SOCKET_EVENTS.STROKE_END, {
          roomId: data.roomId,
          stroke: savedStroke
        });

        // Trigger widget notification event to refresh companion widgets
        io.to(data.roomId).emit(SOCKET_EVENTS.WIDGET_REFRESH_TRIGGERED, {
          roomId: data.roomId,
          updatedBy: user.username,
          timestamp: Date.now()
        });

        if (ack) ack({ success: true });
      } catch (err) {
        console.error('Error handling stroke:end:', err);
      }
    });

    // Canvas Undo
    socket.on(SOCKET_EVENTS.CANVAS_UNDO, ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      const undone = strokeEngine.undoStroke(roomId, user.userId);
      if (undone) {
        io.to(roomId).emit(SOCKET_EVENTS.CANVAS_UNDO, {
          roomId,
          strokeId: undone.id,
          userId: user.userId
        });
      }
    });

    // Canvas Redo
    socket.on(SOCKET_EVENTS.CANVAS_REDO, ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      const recovered = strokeEngine.redoStroke(roomId, user.userId);
      if (recovered) {
        io.to(roomId).emit(SOCKET_EVENTS.CANVAS_REDO, {
          roomId,
          stroke: recovered,
          userId: user.userId
        });
      }
    });

    // Canvas Clear
    socket.on(SOCKET_EVENTS.CANVAS_CLEAR, async ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      strokeEngine.clearCanvas(roomId);
      io.to(roomId).emit(SOCKET_EVENTS.CANVAS_CLEAR, {
        roomId,
        clearedBy: user.username,
        timestamp: Date.now()
      });
      io.to(roomId).emit(SOCKET_EVENTS.WIDGET_REFRESH_TRIGGERED, {
        roomId,
        timestamp: Date.now()
      });
    });

    // Reconnection & Sync Request
    socket.on(SOCKET_EVENTS.CANVAS_SYNC_REQUEST, ({ roomId }: { roomId: string }) => {
      if (!roomId) return;
      const strokes = strokeEngine.getRoomStrokes(roomId);
      socket.emit(SOCKET_EVENTS.CANVAS_SYNC_RESPONSE, {
        roomId,
        strokes,
        timestamp: Date.now()
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (currentRoomId) {
        io.to(currentRoomId).emit(SOCKET_EVENTS.ROOM_USER_LEFT, {
          userId: user.userId,
          username: user.username
        });
      }
      console.log(`🔌 [Socket] Disconnected: ${user.username} [${socket.id}]`);
    });
  });
}
