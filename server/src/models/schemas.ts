import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  profilePicture?: string;
  initials: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profilePicture: { type: String, default: '' },
  initials: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Connection Schema
export interface IConnection extends Document {
  connectionId: string;
  userIds: string[];
  status: 'pending' | 'connected' | 'disconnected';
  createdAt: Date;
}

const ConnectionSchema = new Schema<IConnection>({
  connectionId: { type: String, required: true, unique: true, index: true },
  userIds: [{ type: String, required: true }],
  status: { type: String, enum: ['pending', 'connected', 'disconnected'], default: 'connected' },
  createdAt: { type: Date, default: Date.now }
});

// Room Schema
export interface IRoom extends Document {
  roomId: string;
  name: string;
  ownerId: string;
  members: Array<{
    userId: string;
    username: string;
    initials: string;
    avatar?: string;
    joinedAt: Date;
  }>;
  inviteCode: string;
  latestDrawingId?: string;
  latestSnapshotUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: 'Doodlix Canvas' },
  ownerId: { type: String, required: true },
  members: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    initials: { type: String, required: true },
    avatar: { type: String, default: '' },
    joinedAt: { type: Date, default: Date.now }
  }],
  inviteCode: { type: String, required: true, unique: true, index: true },
  latestDrawingId: { type: String, default: '' },
  latestSnapshotUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Drawing Schema
export interface IDrawing extends Document {
  drawingId: string;
  roomId: string;
  authorId: string;
  authorName: string;
  strokes: any[];
  snapshotUrl: string;
  updatedAt: Date;
}

const DrawingSchema = new Schema<IDrawing>({
  drawingId: { type: String, required: true, unique: true, index: true },
  roomId: { type: String, required: true, index: true },
  authorId: { type: String, required: true },
  authorName: { type: String, default: 'Doodler' },
  strokes: { type: [Schema.Types.Mixed as any], default: [] },
  snapshotUrl: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

// Widget Preference Schema
export interface IWidgetPreference extends Document {
  userId: string;
  roomId: string;
  widgetSize: 'small' | 'medium' | 'large';
  theme: 'lavender' | 'soft-pink' | 'purple' | 'minimal-light' | 'midnight-dark';
  previewStyle: 'paper' | 'clean' | 'dot-grid' | 'warm-canvas';
  lastSyncedAt: Date;
}

const WidgetPreferenceSchema = new Schema<IWidgetPreference>({
  userId: { type: String, required: true, index: true },
  roomId: { type: String, required: true },
  widgetSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
  theme: { type: String, enum: ['lavender', 'soft-pink', 'purple', 'minimal-light', 'midnight-dark'], default: 'lavender' },
  previewStyle: { type: String, enum: ['paper', 'clean', 'dot-grid', 'warm-canvas'], default: 'paper' },
  lastSyncedAt: { type: Date, default: Date.now }
});

// Device Token Schema
export interface IDeviceToken extends Document {
  userId: string;
  platform: 'ios' | 'android' | 'web';
  pushToken: string;
  lastUpdated: Date;
}

const DeviceTokenSchema = new Schema<IDeviceToken>({
  userId: { type: String, required: true, index: true },
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  pushToken: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const ConnectionModel = mongoose.models.Connection || mongoose.model<IConnection>('Connection', ConnectionSchema);
export const RoomModel = mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
export const DrawingModel = mongoose.models.Drawing || mongoose.model<IDrawing>('Drawing', DrawingSchema);
export const WidgetPreferenceModel = mongoose.models.WidgetPreference || mongoose.model<IWidgetPreference>('WidgetPreference', WidgetPreferenceSchema);
export const DeviceTokenModel = mongoose.models.DeviceToken || mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema);
