import express from 'express';
import jwt from 'jsonwebtoken';
import { syncBus } from '../services/syncBus.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'jobmatch_super_secret_jwt_key_rvce_2026';

// 1. Server-Sent Events (SSE) Stream Endpoint
router.get('/stream', (req, res) => {
  // Support both header and query param token for EventSource compatibility
  let user = null;
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (token) {
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch {
      // Allow unauthenticated connection with limited public broadcast
      user = null;
    }
  }

  // Set mandatory SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  res.flushHeaders?.();

  const clientId = syncBus.addClient(res, user);

  req.on('close', () => {
    syncBus.removeClient(res);
  });
});

// 2. Health & Active Listener Metrics
router.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    active_listeners: syncBus.getClientCount(),
    timestamp: new Date().toISOString()
  });
});

// 3. Manual Broadcast Trigger (T&P or Internal Test Automation)
router.post('/broadcast', authenticateToken, requireRole(['T_AND_P']), (req, res) => {
  const { type, payload, targetRole, targetUserId } = req.body;
  if (!type) {
    return res.status(400).json({ error: 'Event type is required' });
  }

  syncBus.broadcast(type, payload || {}, targetRole || null, targetUserId || null);
  res.json({
    message: `Event [${type}] broadcasted successfully`,
    clients_notified: syncBus.getClientCount()
  });
});

export default router;

