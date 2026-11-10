import { Router } from 'express';
import { signup, login, demoLogin, getMe, registerDeviceToken } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', authMiddleware as any, getMe as any);
router.post('/device-token', authMiddleware as any, registerDeviceToken as any);

export default router;

