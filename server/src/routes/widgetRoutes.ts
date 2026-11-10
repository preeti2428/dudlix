import { Router } from 'express';
import {
  getWidgetDataForRoom,
  getWidgetDataForUser,
  getWidgetSvgImage,
  saveWidgetPreferences,
  getWidgetPreferences
} from '../controllers/widgetController.js';

const router = Router();

// Widget endpoints for iOS WidgetKit & Android Glance
router.get('/:roomId', getWidgetDataForRoom);
router.get('/user/:userId/latest', getWidgetDataForUser);
router.get('/:roomId/image.svg', getWidgetSvgImage);
router.post('/preferences', saveWidgetPreferences);
router.get('/preferences/:userId', getWidgetPreferences);

export default router;

