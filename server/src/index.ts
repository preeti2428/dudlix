import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { setupDrawingSocket } from './sockets/drawingSocket.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import drawingRoutes from './routes/drawingRoutes.js';
import widgetRoutes from './routes/widgetRoutes.js';
import { DOODLIX_THEME } from './shared/types.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS support for mobile devices and web previews
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling']
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/drawings', drawingRoutes);
app.use('/api/widgets', widgetRoutes);

// Health & System Info
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    product: DOODLIX_THEME.typography.brandTitle,
    tagline: DOODLIX_THEME.typography.tagline,
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Simulator Route
app.get('/simulator', (req: Request, res: Response) => {
  res.sendFile(path.resolve(process.cwd(), 'server', 'src', 'simulator.html'));
});

// Root Welcome Endpoint
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <title>DOODLIX API & Realtime Sync Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAF9FF; color: #24213A; padding: 40px; }
          .card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(118, 101, 232, 0.1); max-width: 600px; margin: 0 auto; border: 1px solid #EEEAFE; }
          h1 { color: #7665E8; margin-top: 0; }
          .badge { background: #EEEAFE; color: #7665E8; font-weight: bold; padding: 4px 12px; border-radius: 20px; font-size: 13px; display: inline-block; }
          code { background: #F4F2FF; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">LIVE ENGINE ACTIVE</span>
          <h1>Doodlix Backend</h1>
          <p><strong>Draw on your screen. Connect through creativity.</strong></p>
          <p>Live drawing synchronization server for cross-platform iOS & Android home-screen widgets.</p>
          <ul>
            <li><strong>Interactive Dual-Device Simulator:</strong> <a href="/simulator" style="color:#7665E8; font-weight:bold;">Open /simulator (iPhone ↔ Android Live Sandbox)</a></li>
            <li><strong>Widget API:</strong> <code>/api/widgets/:roomId</code></li>
            <li><strong>Health Check:</strong> <code>/api/health</code></li>
            <li><strong>Socket.IO:</strong> Active on root path</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Initialize Socket.IO Handler
setupDrawingSocket(io);

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  await connectDB();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🎨 DOODLIX BACKEND RUNNING ON http://localhost:${PORT}`);
    console.log(`📱 Widget Service Endpoint: http://localhost:${PORT}/api/widgets/:roomId`);
    console.log(`⚡ Real-Time Socket.IO: ws://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting Doodlix server:', err);
});
