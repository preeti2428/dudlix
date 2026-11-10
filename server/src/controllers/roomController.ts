import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../services/dataStore.js';
import { AuthRequest } from '../middleware/auth.js';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DLX-${code}`;
}

export async function createRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name } = req.body;
    const user = await dataStore.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const roomId = `room_${uuidv4().substring(0, 12)}`;
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();

    const newRoom = await dataStore.createRoom({
      roomId,
      name: name?.trim() || `${user.username}'s Doodlix`,
      ownerId: user.userId,
      members: [
        {
          userId: user.userId,
          username: user.username,
          initials: user.initials,
          avatar: user.profilePicture,
          joinedAt: now
        }
      ],
      inviteCode,
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json({
      success: true,
      room: newRoom
    });
  } catch (err: any) {
    console.error('Create room error:', err);
    res.status(500).json({ success: false, message: 'Server error creating room.' });
  }
}

export async function getMyRooms(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const rooms = await dataStore.findRoomsForUser(req.user.userId);
    res.status(200).json({
      success: true,
      rooms
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error fetching rooms.' });
  }
}

export async function getRoomById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const roomId = req.params.roomId as string;
    const room = await dataStore.findRoomById(roomId);

    if (!room) {
      res.status(404).json({ success: false, message: 'Room not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      room
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function joinRoomByInvite(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { inviteCode } = req.body;
    if (!inviteCode) {
      res.status(400).json({ success: false, message: 'Invite code is required.' });
      return;
    }

    const room = await dataStore.findRoomByInviteCode(inviteCode.trim());
    if (!room) {
      res.status(404).json({ success: false, message: 'Invalid invite code. Room not found.' });
      return;
    }

    const user = await dataStore.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const updatedRoom = await dataStore.addMemberToRoom(room.roomId, {
      userId: user.userId,
      username: user.username,
      initials: user.initials,
      avatar: user.profilePicture,
      joinedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Joined room successfully!',
      room: updatedRoom
    });
  } catch (err: any) {
    console.error('Join room error:', err);
    res.status(500).json({ success: false, message: 'Server error joining room.' });
  }
}

export async function leaveRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const roomId = req.params.roomId as string;
    await dataStore.removeMemberFromRoom(roomId, req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Left room successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error leaving room.' });
  }
}
