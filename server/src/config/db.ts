import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export let isUsingMongo = false;

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('⚡ [DB] No MONGODB_URI configured. Initializing embedded file-backed persistent database.');
    ensureLocalDbDirectory();
    isUsingMongo = false;
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    isUsingMongo = true;
    console.log('✅ [DB] Connected to MongoDB Atlas successfully.');
  } catch (error) {
    console.warn('⚠️ [DB] MongoDB Atlas connection failed. Falling back to embedded persistent database:', (error as Error).message);
    ensureLocalDbDirectory();
    isUsingMongo = false;
  }
}

export function ensureLocalDbDirectory(): void {
  const dir = path.resolve(process.cwd(), 'server', 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
