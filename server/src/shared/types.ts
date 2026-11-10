// DOODLIX Shared Types & Interfaces

export type PlatformType = 'ios' | 'android' | 'web';

export type WidgetSize = 'small' | 'medium' | 'large';

export type WidgetTheme = 'lavender' | 'soft-pink' | 'purple' | 'minimal-light' | 'midnight-dark';

export type PreviewStyle = 'paper' | 'clean' | 'dot-grid' | 'warm-canvas';

export type ConnectionStatus = 'pending' | 'connected' | 'disconnected';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface Stroke {
  id: string;
  userId: string;
  color: string;
  size: number;
  tool: 'pen' | 'pencil' | 'eraser';
  opacity?: number;
  points: Point[];
  createdAt: number;
}

export interface User {
  id: string;
  userId?: string;
  username: string;
  email: string;
  profilePicture?: string;
  initials?: string;
  createdAt: string;
}

export interface RoomMember {
  userId: string;
  username: string;
  initials: string;
  avatar?: string;
  joinedAt: string;
}

export interface Room {
  id: string;
  roomId: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  members: RoomMember[];
  latestDrawingId?: string;
  latestSnapshotUrl?: string;
  updatedAt: string;
  createdAt: string;
}

export interface DrawingSnapshot {
  id: string;
  drawingId: string;
  roomId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  strokesCount: number;
  snapshotDataUrl: string; // Base64 data URL or storage URL
  vectorData?: Stroke[];
  createdAt: string;
}

export interface WidgetPayload {
  roomId: string;
  roomName: string;
  friendName: string;
  friendInitials: string;
  lastUpdated: string;
  lastUpdatedFormatted: string;
  drawingSnapshotUrl?: string;
  drawingBase64?: string;
  strokesCount: number;
  theme: WidgetTheme;
  size: WidgetSize;
  isConnected: boolean;
  deepLinkUrl: string;
}

export interface WidgetPreference {
  userId: string;
  roomId: string;
  widgetSize: WidgetSize;
  theme: WidgetTheme;
  previewStyle: PreviewStyle;
  lastSyncedAt: string;
}

export interface DeviceToken {
  userId: string;
  platform: PlatformType;
  pushToken: string;
  lastUpdated: string;
}

// Brand Identity Design Constants
export const DOODLIX_THEME = {
  colors: {
    primaryPurple: '#7665E8',
    primaryPurpleDark: '#5D4BC7',
    primaryPurpleLight: '#8F80F0',
    lavender: '#EEEAFE',
    lavenderMuted: '#F4F2FF',
    softPink: '#FFDCE8',
    softPinkLight: '#FFF0F5',
    background: '#FAF9FF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    textPrimary: '#24213A',
    textSecondary: '#6B6882',
    textMuted: '#9B98AE',
    border: '#E8E5F5',
    borderStrong: '#D6D1EE',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    fontFamily: 'System',
    brandTitle: 'Doodlix',
    tagline: 'Draw on your screen. Connect through creativity.',
  },
};

// Real-Time Socket Protocols
export const SOCKET_EVENTS = {
  // Room
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ROOM_USER_JOINED: 'room:user_joined',
  ROOM_USER_LEFT: 'room:user_left',
  ROOM_PRESENCE: 'room:presence',

  // Canvas
  STROKE_START: 'stroke:start',
  STROKE_MOVE: 'stroke:move',
  STROKE_END: 'stroke:end',
  CANVAS_UNDO: 'canvas:undo',
  CANVAS_REDO: 'canvas:redo',
  CANVAS_CLEAR: 'canvas:clear',
  CANVAS_SYNC_REQUEST: 'canvas:sync_request',
  CANVAS_SYNC_RESPONSE: 'canvas:sync_response',

  // Widget
  WIDGET_REFRESH_TRIGGERED: 'widget:refresh_triggered',
  DRAWING_SAVED: 'drawing:saved',
} as const;

