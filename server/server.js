import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db/database.js';
import { seedDatabase } from './db/seed.js';

// Import route modules
import authRoutes from './routes/auth.js';
import studentsRoutes from './routes/students.js';
import jobsRoutes from './routes/jobs.js';
import matchingRoutes from './routes/matching.js';
import applicationsRoutes from './routes/applications.js';
import preparationRoutes from './routes/preparation.js';
import institutionRoutes from './routes/institution.js';
import agentopsRoutes from './routes/agentops.js';
import santraAiRoutes from './routes/santraAi.js';
import companiesRoutes from './routes/companies.js';
import syncRoutes from './routes/sync.js';
import notificationsRoutes from './routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.join(__dirname, '../client/dist');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Explicit CORS Origin Allowlist
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://jobmatchingagent.onrender.com'
];

const envAllowed = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOriginsSet = new Set([...defaultAllowedOrigins, ...envAllowed]);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server, same-origin)
    if (!origin) return callback(null, true);

    if (allowedOriginsSet.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized.`), false);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Request logging (sanitized, excluding asset requests)
app.use((req, res, next) => {
  if (!req.url.startsWith('/assets') && !req.url.endsWith('.ico') && !req.url.endsWith('.png') && !req.url.endsWith('.webp')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'JobMatch AI — Agent 50 & SantraAI Platform API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/matches', matchingRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/preparation', preparationRoutes);
app.use('/api/institution', institutionRoutes);
app.use('/api/agentops', agentopsRoutes);
app.use('/api/santra-ai', santraAiRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/notifications', notificationsRoutes);

// Static uploads (uploaded company logos & documents)
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/api/uploads', express.static(UPLOADS_DIR));

// Static assets from built frontend (client/dist)
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
}

// SPA Fallback for all other non-API GET requests
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    const indexPath = path.join(CLIENT_DIST, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(200).send('JobMatch AI API is running. Build frontend with `npm run build` to view client application.');
  }
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS policy violation')) {
    return res.status(403).json({ error: err.message });
  }
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error occurred',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

let serverInstance = null;

// Initialize database schema and start server
async function startServer() {
  try {
    await db.init();
    await seedDatabase();
    serverInstance = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 JobMatch AI Backend API running on port ${PORT}`);
      console.log(`🌐 Serving Frontend from: ${CLIENT_DIST}`);
      console.log(`🤖 SantraAI Engine active & bound to JobMatch DB`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
const handleShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down JobMatch AI...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      try {
        await db.close();
        console.log('Database connections cleanly closed.');
      } catch (err) {
        console.error('Error during database close:', err);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
