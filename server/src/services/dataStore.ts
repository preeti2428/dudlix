import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isUsingMongo } from '../config/db.js';
import {
  UserModel,
  ConnectionModel,
  RoomModel,
  DrawingModel,
  WidgetPreferenceModel,
  DeviceTokenModel
} from '../models/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UserRecord {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  profilePicture?: string;
  initials: string;
  createdAt: string;
}

export interface ConnectionRecord {
  connectionId: string;
  userIds: string[];
  status: 'pending' | 'connected' | 'disconnected';
  createdAt: string;
}

export interface RoomRecord {
  roomId: string;
  name: string;
  ownerId: string;
  members: Array<{
    userId: string;
    username: string;
    initials: string;
    avatar?: string;
    joinedAt: string;
  }>;
  inviteCode: string;
  latestDrawingId?: string;
  latestSnapshotUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingRecord {
  drawingId: string;
  roomId: string;
  authorId: string;
  authorName: string;
  strokes: any[];
  snapshotUrl: string;
  updatedAt: string;
}

export interface WidgetPreferenceRecord {
  userId: string;
  roomId: string;
  widgetSize: 'small' | 'medium' | 'large';
  theme: 'lavender' | 'soft-pink' | 'purple' | 'minimal-light' | 'midnight-dark';
  previewStyle: 'paper' | 'clean' | 'dot-grid' | 'warm-canvas';
  lastSyncedAt: string;
}

export interface DeviceTokenRecord {
  userId: string;
  platform: 'ios' | 'android' | 'web';
  pushToken: string;
  lastUpdated: string;
}

interface LocalDatabaseState {
  users: Record<string, UserRecord>;
  connections: Record<string, ConnectionRecord>;
  rooms: Record<string, RoomRecord>;
  drawings: Record<string, DrawingRecord>;
  widgetPreferences: Record<string, WidgetPreferenceRecord>;
  deviceTokens: Record<string, DeviceTokenRecord>;
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'server', 'data', 'db.json');

class DataStoreService {
  private localState: LocalDatabaseState = {
    users: {},
    connections: {},
    rooms: {},
    drawings: {},
    widgetPreferences: {},
    deviceTokens: {}
  };

  constructor() {
    this.loadLocalDb();
  }

  private loadLocalDb() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.localState = JSON.parse(data);
      } else {
        this.saveLocalDb();
      }
    } catch (err) {
      console.warn('⚠️ Could not load local db.json, using clean memory state:', err);
    }
  }

  private saveLocalDb() {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.localState, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ Failed to save db.json:', err);
    }
  }

  // --- USER OPERATIONS ---
  async createUser(user: UserRecord): Promise<UserRecord> {
    if (isUsingMongo) {
      const created = await UserModel.create({
        ...user,
        createdAt: new Date(user.createdAt)
      });
      return {
        userId: created.userId,
        username: created.username,
        email: created.email,
        passwordHash: created.passwordHash,
        profilePicture: created.profilePicture,
        initials: created.initials,
        createdAt: created.createdAt.toISOString()
      };
    }

    this.localState.users[user.userId] = user;
    this.saveLocalDb();
    return user;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    if (isUsingMongo) {
      const found = await UserModel.findOne({ email: email.toLowerCase() });
      if (!found) return null;
      return {
        userId: found.userId,
        username: found.username,
        email: found.email,
        passwordHash: found.passwordHash,
        profilePicture: found.profilePicture,
        initials: found.initials,
        createdAt: found.createdAt.toISOString()
      };
    }

    const lower = email.toLowerCase();
    const user = Object.values(this.localState.users).find(u => u.email.toLowerCase() === lower);
    return user || null;
  }

  async findUserById(userId: string): Promise<UserRecord | null> {
    if (isUsingMongo) {
      const found = await UserModel.findOne({ userId });
      if (!found) return null;
      return {
        userId: found.userId,
        username: found.username,
        email: found.email,
        passwordHash: found.passwordHash,
        profilePicture: found.profilePicture,
        initials: found.initials,
        createdAt: found.createdAt.toISOString()
      };
    }

    return this.localState.users[userId] || null;
  }

  // --- ROOM OPERATIONS ---
  async createRoom(room: RoomRecord): Promise<RoomRecord> {
    if (isUsingMongo) {
      const created = await RoomModel.create({
        ...room,
        createdAt: new Date(room.createdAt),
        updatedAt: new Date(room.updatedAt)
      });
      return {
        roomId: created.roomId,
        name: created.name,
        ownerId: created.ownerId,
        members: created.members.map((m: any) => ({
          userId: m.userId,
          username: m.username,
          initials: m.initials,
          avatar: m.avatar,
          joinedAt: m.joinedAt.toISOString()
        })),
        inviteCode: created.inviteCode,
        latestDrawingId: created.latestDrawingId,
        latestSnapshotUrl: created.latestSnapshotUrl,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString()
      };
    }

    this.localState.rooms[room.roomId] = room;
    this.saveLocalDb();
    return room;
  }

  async findRoomById(roomId: string): Promise<RoomRecord | null> {
    if (isUsingMongo) {
      const found = await RoomModel.findOne({ roomId });
      if (!found) return null;
      return {
        roomId: found.roomId,
        name: found.name,
        ownerId: found.ownerId,
        members: found.members.map((m: any) => ({
          userId: m.userId,
          username: m.username,
          initials: m.initials,
          avatar: m.avatar,
          joinedAt: m.joinedAt.toISOString()
        })),
        inviteCode: found.inviteCode,
        latestDrawingId: found.latestDrawingId,
        latestSnapshotUrl: found.latestSnapshotUrl,
        createdAt: found.createdAt.toISOString(),
        updatedAt: found.updatedAt.toISOString()
      };
    }

    return this.localState.rooms[roomId] || null;
  }

  async findRoomByInviteCode(inviteCode: string): Promise<RoomRecord | null> {
    const code = inviteCode.trim().toUpperCase();
    if (isUsingMongo) {
      const found = await RoomModel.findOne({ inviteCode: code });
      if (!found) return null;
      return {
        roomId: found.roomId,
        name: found.name,
        ownerId: found.ownerId,
        members: found.members.map((m: any) => ({
          userId: m.userId,
          username: m.username,
          initials: m.initials,
          avatar: m.avatar,
          joinedAt: m.joinedAt.toISOString()
        })),
        inviteCode: found.inviteCode,
        latestDrawingId: found.latestDrawingId,
        latestSnapshotUrl: found.latestSnapshotUrl,
        createdAt: found.createdAt.toISOString(),
        updatedAt: found.updatedAt.toISOString()
      };
    }

    const room = Object.values(this.localState.rooms).find(r => r.inviteCode.toUpperCase() === code);
    return room || null;
  }

  async findRoomsForUser(userId: string): Promise<RoomRecord[]> {
    if (isUsingMongo) {
      const found = await RoomModel.find({ 'members.userId': userId }).sort({ updatedAt: -1 });
      return found.map((f: any) => ({
        roomId: f.roomId,
        name: f.name,
        ownerId: f.ownerId,
        members: f.members.map((m: any) => ({
          userId: m.userId,
          username: m.username,
          initials: m.initials,
          avatar: m.avatar,
          joinedAt: m.joinedAt.toISOString()
        })),
        inviteCode: f.inviteCode,
        latestDrawingId: f.latestDrawingId,
        latestSnapshotUrl: f.latestSnapshotUrl,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString()
      }));
    }

    return Object.values(this.localState.rooms)
      .filter(r => r.members.some(m => m.userId === userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async addMemberToRoom(roomId: string, member: RoomRecord['members'][0]): Promise<RoomRecord | null> {
    if (isUsingMongo) {
      const room = await RoomModel.findOne({ roomId });
      if (!room) return null;
      if (!room.members.some((m: any) => m.userId === member.userId)) {
        room.members.push({
          ...member,
          joinedAt: new Date(member.joinedAt)
        });
        room.updatedAt = new Date();
        await room.save();
      }
      return this.findRoomById(roomId);
    }

    const room = this.localState.rooms[roomId];
    if (!room) return null;
    if (!room.members.some(m => m.userId === member.userId)) {
      room.members.push(member);
      room.updatedAt = new Date().toISOString();
      this.saveLocalDb();
    }
    return room;
  }

  async removeMemberFromRoom(roomId: string, userId: string): Promise<RoomRecord | null> {
    if (isUsingMongo) {
      const room = await RoomModel.findOne({ roomId });
      if (!room) return null;
      room.members = room.members.filter((m: any) => m.userId !== userId) as any;
      room.updatedAt = new Date();
      await room.save();
      return this.findRoomById(roomId);
    }

    const room = this.localState.rooms[roomId];
    if (!room) return null;
    room.members = room.members.filter(m => m.userId !== userId);
    room.updatedAt = new Date().toISOString();
    this.saveLocalDb();
    return room;
  }

  async updateRoomDrawing(roomId: string, drawingId: string, snapshotUrl: string): Promise<void> {
    const now = new Date().toISOString();
    if (isUsingMongo) {
      await RoomModel.updateOne(
        { roomId },
        { latestDrawingId: drawingId, latestSnapshotUrl: snapshotUrl, updatedAt: new Date() }
      );
      return;
    }

    if (this.localState.rooms[roomId]) {
      this.localState.rooms[roomId].latestDrawingId = drawingId;
      this.localState.rooms[roomId].latestSnapshotUrl = snapshotUrl;
      this.localState.rooms[roomId].updatedAt = now;
      this.saveLocalDb();
    }
  }

  // --- DRAWING OPERATIONS ---
  async saveDrawing(drawing: DrawingRecord): Promise<DrawingRecord> {
    if (isUsingMongo) {
      const created = await DrawingModel.create({
        ...drawing,
        updatedAt: new Date(drawing.updatedAt)
      });
      await this.updateRoomDrawing(drawing.roomId, drawing.drawingId, drawing.snapshotUrl);
      return {
        drawingId: created.drawingId,
        roomId: created.roomId,
        authorId: created.authorId,
        authorName: created.authorName,
        strokes: created.strokes,
        snapshotUrl: created.snapshotUrl,
        updatedAt: created.updatedAt.toISOString()
      };
    }

    this.localState.drawings[drawing.drawingId] = drawing;
    await this.updateRoomDrawing(drawing.roomId, drawing.drawingId, drawing.snapshotUrl);
    this.saveLocalDb();
    return drawing;
  }

  async getLatestDrawingForRoom(roomId: string): Promise<DrawingRecord | null> {
    if (isUsingMongo) {
      const found = await DrawingModel.findOne({ roomId }).sort({ updatedAt: -1 });
      if (!found) return null;
      return {
        drawingId: found.drawingId,
        roomId: found.roomId,
        authorId: found.authorId,
        authorName: found.authorName,
        strokes: found.strokes,
        snapshotUrl: found.snapshotUrl,
        updatedAt: found.updatedAt.toISOString()
      };
    }

    const list = Object.values(this.localState.drawings)
      .filter(d => d.roomId === roomId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return list[0] || null;
  }

  async getDrawingsHistoryForRoom(roomId: string, limit = 20): Promise<DrawingRecord[]> {
    if (isUsingMongo) {
      const found = await DrawingModel.find({ roomId }).sort({ updatedAt: -1 }).limit(limit);
      return found.map((f: any) => ({
        drawingId: f.drawingId,
        roomId: f.roomId,
        authorId: f.authorId,
        authorName: f.authorName,
        strokes: f.strokes,
        snapshotUrl: f.snapshotUrl,
        updatedAt: f.updatedAt.toISOString()
      }));
    }

    return Object.values(this.localState.drawings)
      .filter(d => d.roomId === roomId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  // --- WIDGET PREFERENCE OPERATIONS ---
  async getWidgetPreference(userId: string, roomId?: string): Promise<WidgetPreferenceRecord | null> {
    if (isUsingMongo) {
      const query: any = { userId };
      if (roomId) query.roomId = roomId;
      const found = await WidgetPreferenceModel.findOne(query).sort({ lastSyncedAt: -1 });
      if (!found) return null;
      return {
        userId: found.userId,
        roomId: found.roomId,
        widgetSize: found.widgetSize,
        theme: found.theme,
        previewStyle: found.previewStyle,
        lastSyncedAt: found.lastSyncedAt.toISOString()
      };
    }

    const list = Object.values(this.localState.widgetPreferences)
      .filter(p => p.userId === userId && (!roomId || p.roomId === roomId));
    return list[0] || null;
  }

  async setWidgetPreference(pref: WidgetPreferenceRecord): Promise<WidgetPreferenceRecord> {
    const key = `${pref.userId}_${pref.roomId}`;
    if (isUsingMongo) {
      await WidgetPreferenceModel.findOneAndUpdate(
        { userId: pref.userId, roomId: pref.roomId },
        { ...pref, lastSyncedAt: new Date(pref.lastSyncedAt) },
        { upsert: true, new: true }
      );
      return pref;
    }

    this.localState.widgetPreferences[key] = pref;
    this.saveLocalDb();
    return pref;
  }

  // --- DEVICE TOKEN OPERATIONS ---
  async registerDeviceToken(token: DeviceTokenRecord): Promise<void> {
    if (isUsingMongo) {
      await DeviceTokenModel.findOneAndUpdate(
        { userId: token.userId, platform: token.platform },
        { pushToken: token.pushToken, lastUpdated: new Date() },
        { upsert: true }
      );
      return;
    }

    const key = `${token.userId}_${token.platform}`;
    this.localState.deviceTokens[key] = token;
    this.saveLocalDb();
  }

  async getDeviceTokensForUser(userId: string): Promise<DeviceTokenRecord[]> {
    if (isUsingMongo) {
      const found = await DeviceTokenModel.find({ userId });
      return found.map((f: any) => ({
        userId: f.userId,
        platform: f.platform,
        pushToken: f.pushToken,
        lastUpdated: f.lastUpdated.toISOString()
      }));
    }

    return Object.values(this.localState.deviceTokens).filter(t => t.userId === userId);
  }
}

export const dataStore = new DataStoreService();
