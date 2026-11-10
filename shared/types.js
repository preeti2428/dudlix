"use strict";
// DOODLIX Shared Types & Interfaces
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = exports.DOODLIX_THEME = void 0;
// Brand Identity Design Constants
exports.DOODLIX_THEME = {
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
exports.SOCKET_EVENTS = {
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
};
