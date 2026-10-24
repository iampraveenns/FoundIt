import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import itemsRouter from './routes/items.js';
import authRouter from './routes/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Dev server must run strictly on port 3000
const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foundit';

// Initialize Socket.io with permissive CORS for local dev & preview
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Attach Socket.io instance to Express app for access inside route controllers
app.set('io', io);

// Express Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Mount Auth and Items Routers
app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/items', itemsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FoundIt Lost & Found API',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'in-memory-fallback',
    activeSockets: io.engine.clientsCount,
    timestamp: new Date().toISOString(),
  });
});

// Socket.io connection and real-time events
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id} (Total: ${io.engine.clientsCount})`);

  socket.emit('connected', {
    status: 'online',
    socketId: socket.id,
    timestamp: Date.now(),
  });

  // Join item room for secure owner-finder chat
  socket.on('chat:join', (itemId) => {
    socket.join(`item:${itemId}`);
    console.log(`[Socket.io] ${socket.id} joined secure chat room item:${itemId}`);
  });

  socket.on('chat:leave', (itemId) => {
    socket.leave(`item:${itemId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Client disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

// MongoDB Connection with graceful fallback
async function connectDatabase() {
  try {
    console.log(`[MongoDB] Connecting to ${MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@')}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to prevent stalling if local mongod is absent
    });
    console.log('[MongoDB] Connected successfully to database');
  } catch (err) {
    console.warn(
      `[MongoDB] Connection notice: ${err.message}. Running with resilient in-memory data store for live demo!`
    );
  }
}

// Vite middleware integration for development, static serve for production
async function setupViteOrStatic() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);

      // Serve transformed index.html for non-API client routes
      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        if (
          url.startsWith('/api') ||
          url.startsWith('/items') ||
          url.startsWith('/found') ||
          url.startsWith('/socket.io')
        ) {
          return next();
        }
        try {
          const indexHtmlPath = path.resolve(__dirname, 'index.html');
          let template = fs.readFileSync(indexHtmlPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          if (vite && typeof vite.ssrFixStacktrace === 'function') {
            vite.ssrFixStacktrace(e);
          }
          next(e);
        }
      });

      console.log('[Vite] Mounted Vite development middleware');
    } catch (e) {
      console.error('[Vite] Failed to mount Vite middleware:', e);
    }
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}

// Start Server immediately so port 3000 is listening right away for pre-warming
await setupViteOrStatic();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
=============================================================
  FoundIt Real-Time Lost & Found Server
  Listening on http://0.0.0.0:${PORT}
  Socket.io server active
  Gemini Vision & Semantic Engine ready
=============================================================
  `);
  // Connect to database in the background without blocking server listening
  connectDatabase().catch((err) => {
    console.warn('[MongoDB] Background connection error:', err.message);
  });
});

export { app, server, io };
