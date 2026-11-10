import { Router } from 'express';
import {
  createRoom,
  getMyRooms,
  getRoomById,
  joinRoomByInvite,
  leaveRoom
} from '../controllers/roomController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware as any);

router.post('/', createRoom as any);
router.get('/', getMyRooms as any);
router.get('/:roomId', getRoomById as any);
router.post('/join', joinRoomByInvite as any);
router.delete('/:roomId/leave', leaveRoom as any);

export default router;

