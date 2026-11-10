import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { SOCKET_EVENTS, Stroke } from '../shared/types';

type StrokeCallback = (stroke: Stroke) => void;
type StrokeStreamCallback = (data: { roomId: string; stroke: Stroke }) => void;
type EventCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private currentRoomId: string | null = null;
  private isConnecting = false;
  private pendingStrokes: Array<{ roomId: string; stroke: Stroke }> = [];

  // Listeners
  private onStrokeEndListeners: Set<StrokeCallback> = new Set();
  private onStrokeMoveListeners: Set<StrokeStreamCallback> = new Set();
  private onCanvasSyncListeners: Set<(strokes: Stroke[]) => void> = new Set();
  private onCanvasUndoListeners: Set<EventCallback> = new Set();
  private onCanvasRedoListeners: Set<EventCallback> = new Set();
  private onCanvasClearListeners: Set<EventCallback> = new Set();
  private onUserPresenceListeners: Set<EventCallback> = new Set();
  private onWidgetRefreshListeners: Set<EventCallback> = new Set();
  private onConnectionStatusListeners: Set<(connected: boolean) => void> = new Set();

  async connect(): Promise<Socket> {
    if (this.socket?.connected) return this.socket;
    if (this.isConnecting && this.socket) return this.socket;

    this.isConnecting = true;
    const baseUrl = await api.getBaseUrl();
    const token = await AsyncStorage.getItem('doodlix_auth_token');
    const userJson = await AsyncStorage.getItem('doodlix_auth_user');
    const user = userJson ? JSON.parse(userJson) : null;

    this.socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token || undefined,
        guestId: user?.userId || `guest_${Math.random().toString(36).substring(2, 7)}`,
        guestName: user?.username || 'Doodler',
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.notifyConnectionStatus(true);
      console.log('⚡ [Socket] Connected to Doodlix Server');

      // Re-join active room if reconnection happened
      if (this.currentRoomId) {
        this.joinRoom(this.currentRoomId);
      }

      // Flush offline pending strokes
      this.flushPendingStrokes();
    });

    this.socket.on('disconnect', () => {
      this.notifyConnectionStatus(false);
      console.log('🔌 [Socket] Disconnected from server');
    });

    this.socket.on('connect_error', (err) => {
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
      console.warn('⚠️ [Socket] Connection error:', err.message);
    });

    // Wire up events
    this.socket.on(SOCKET_EVENTS.STROKE_MOVE, (data: { roomId: string; stroke: Stroke }) => {
      this.onStrokeMoveListeners.forEach(cb => cb(data));
    });

    this.socket.on(SOCKET_EVENTS.STROKE_END, (data: { roomId: string; stroke: Stroke }) => {
      this.onStrokeEndListeners.forEach(cb => cb(data.stroke));
    });

    this.socket.on(SOCKET_EVENTS.CANVAS_SYNC_RESPONSE, (data: { strokes: Stroke[] }) => {
      this.onCanvasSyncListeners.forEach(cb => cb(data.strokes));
    });

    this.socket.on(SOCKET_EVENTS.CANVAS_UNDO, (data) => {
      this.onCanvasUndoListeners.forEach(cb => cb(data));
    });

    this.socket.on(SOCKET_EVENTS.CANVAS_REDO, (data) => {
      this.onCanvasRedoListeners.forEach(cb => cb(data));
    });

    this.socket.on(SOCKET_EVENTS.CANVAS_CLEAR, (data) => {
      this.onCanvasClearListeners.forEach(cb => cb(data));
    });

    this.socket.on(SOCKET_EVENTS.ROOM_USER_JOINED, (data) => {
      this.onUserPresenceListeners.forEach(cb => cb({ type: 'joined', ...data }));
    });

    this.socket.on(SOCKET_EVENTS.ROOM_USER_LEFT, (data) => {
      this.onUserPresenceListeners.forEach(cb => cb({ type: 'left', ...data }));
    });

    this.socket.on(SOCKET_EVENTS.WIDGET_REFRESH_TRIGGERED, (data) => {
      this.onWidgetRefreshListeners.forEach(cb => cb(data));
    });

    return this.socket;
  }

  joinRoom(roomId: string): Promise<boolean> {
    this.currentRoomId = roomId;
    return new Promise(async (resolve) => {
      const socket = await this.connect();
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId }, (res: any) => {
        resolve(res?.success ?? true);
      });
    });
  }

  leaveRoom(): void {
    if (this.currentRoomId && this.socket) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId: this.currentRoomId });
      this.currentRoomId = null;
    }
  }

  emitStrokeMove(roomId: string, stroke: Stroke): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.STROKE_MOVE, { roomId, stroke });
    }
  }

  emitStrokeEnd(roomId: string, stroke: Stroke): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.STROKE_END, { roomId, stroke });
    } else {
      // Store in offline buffer to synchronize on reconnect
      this.pendingStrokes.push({ roomId, stroke });
    }
  }

  emitUndo(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.CANVAS_UNDO, { roomId });
    }
  }

  emitRedo(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.CANVAS_REDO, { roomId });
    }
  }

  emitClear(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.CANVAS_CLEAR, { roomId });
    }
  }

  requestCanvasSync(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.CANVAS_SYNC_REQUEST, { roomId });
    }
  }

  private flushPendingStrokes(): void {
    if (this.pendingStrokes.length === 0 || !this.socket?.connected) return;
    console.log(`🔄 Flushing ${this.pendingStrokes.length} pending offline strokes...`);
    const strokes = [...this.pendingStrokes];
    this.pendingStrokes = [];
    strokes.forEach(item => {
      this.socket?.emit(SOCKET_EVENTS.STROKE_END, item);
    });
  }

  // Subscriptions
  onStrokeMove(cb: StrokeStreamCallback) {
    this.onStrokeMoveListeners.add(cb);
    return () => this.onStrokeMoveListeners.delete(cb);
  }

  onStrokeEnd(cb: StrokeCallback) {
    this.onStrokeEndListeners.add(cb);
    return () => this.onStrokeEndListeners.delete(cb);
  }

  onCanvasSync(cb: (strokes: Stroke[]) => void) {
    this.onCanvasSyncListeners.add(cb);
    return () => this.onCanvasSyncListeners.delete(cb);
  }

  onCanvasUndo(cb: EventCallback) {
    this.onCanvasUndoListeners.add(cb);
    return () => this.onCanvasUndoListeners.delete(cb);
  }

  onCanvasRedo(cb: EventCallback) {
    this.onCanvasRedoListeners.add(cb);
    return () => this.onCanvasRedoListeners.delete(cb);
  }

  onCanvasClear(cb: EventCallback) {
    this.onCanvasClearListeners.add(cb);
    return () => this.onCanvasClearListeners.delete(cb);
  }

  onPresence(cb: EventCallback) {
    this.onUserPresenceListeners.add(cb);
    return () => this.onUserPresenceListeners.delete(cb);
  }

  onWidgetRefresh(cb: EventCallback) {
    this.onWidgetRefreshListeners.add(cb);
    return () => this.onWidgetRefreshListeners.delete(cb);
  }

  onConnectionStatus(cb: (connected: boolean) => void) {
    this.onConnectionStatusListeners.add(cb);
    cb(this.socket?.connected ?? false);
    return () => this.onConnectionStatusListeners.delete(cb);
  }

  private notifyConnectionStatus(connected: boolean) {
    this.onConnectionStatusListeners.forEach(cb => cb(connected));
  }
}

export const socketService = new SocketService();

