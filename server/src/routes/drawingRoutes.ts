import { Router } from 'express';
import {
  getLatestDrawing,
  saveDrawing,
  getDrawingHistory,
  clearCanvas
} from '../controllers/drawingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware as any);

router.get('/:roomId', getLatestDrawing as any);
router.post('/:roomId', saveDrawing as any);
router.get('/:roomId/history', getDrawingHistory as any);
router.delete('/:roomId/clear', clearCanvas as any);

export default router;

