import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dataStore } from '../services/dataStore.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ success: false, message: 'Username, email and password are required.' });
      return;
    }

    const existing = await dataStore.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const initials = username
      .trim()
      .split(' ')
      .map((part: string) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DL';

    const userId = uuidv4();
    const newUser = await dataStore.createUser({
      userId,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      initials,
      createdAt: new Date().toISOString()
    });

    const token = generateToken({
      userId: newUser.userId,
      username: newUser.username,
      email: newUser.email
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.email,
        initials: newUser.initials,
        profilePicture: newUser.profilePicture
      }
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await dataStore.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      userId: user.userId,
      username: user.username,
      email: user.email
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        initials: user.initials,
        profilePicture: user.profilePicture
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

/**
 * Instant Demo Mode:
 * Creates or logs in a demo profile ('Person A - Alex' or 'Person B - Taylor')
 * Enables 1-click cross-device testing with zero friction.
 */
export async function demoLogin(req: Request, res: Response): Promise<void> {
  try {
    const role = (req.body.role === 'B' ? 'B' : 'A');
    const email = role === 'A' ? 'alex.personA@doodlix.app' : 'taylor.personB@doodlix.app';
    const username = role === 'A' ? 'Alex (Person A)' : 'Taylor (Person B)';
    const initials = role === 'A' ? 'AX' : 'TB';

    let user = await dataStore.findUserByEmail(email);
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('doodlix2026', salt);
      user = await dataStore.createUser({
        userId: `demo-user-${role.toLowerCase()}-${uuidv4().substring(0, 8)}`,
        username,
        email,
        passwordHash,
        initials,
        createdAt: new Date().toISOString()
      });
    }

    const token = generateToken({
      userId: user.userId,
      username: user.username,
      email: user.email
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        initials: user.initials,
        profilePicture: user.profilePicture
      }
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ success: false, message: 'Server error during demo login.' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await dataStore.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        initials: user.initials,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

export async function registerDeviceToken(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { platform, pushToken } = req.body;
    if (!req.user || !platform || !pushToken) {
      res.status(400).json({ success: false, message: 'Platform and pushToken are required.' });
      return;
    }

    await dataStore.registerDeviceToken({
      userId: req.user.userId,
      platform,
      pushToken,
      lastUpdated: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Device token registered.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

