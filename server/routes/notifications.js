import express from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { syncBus } from '../services/syncBus.js';

const router = express.Router();

/**
 * Universal helper to create a database notification and broadcast it via real-time sync
 */
export async function dispatchNotification({
  userId = null,
  roleTarget = 'ALL', // 'STUDENT', 'T_AND_P', 'HOD', 'ALL'
  title,
  message,
  type = 'INFO', // 'DRIVE', 'INTERVIEW', 'APPLICATION', 'OFFER', 'SYSTEM'
  linkView = null
}) {
  try {
    const id = 'notif_' + crypto.randomBytes(6).toString('hex');
    await db.run(`
      INSERT INTO system_notifications (id, user_id, role_target, title, message, type, is_read, link_view, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
    `, [id, userId, roleTarget, title, message, type, linkView]);

    // Broadcast in real-time to all connected SSE clients
    syncBus.broadcast('NOTIFICATION_CREATED', {
      id,
      user_id: userId,
      role_target: roleTarget,
      title,
      message,
      type,
      link_view: linkView
    }, roleTarget === 'ALL' ? null : roleTarget, userId);

    return id;
  } catch (err) {
    console.error('Error dispatching notification:', err);
    return null;
  }
}

// 1. Get notifications for logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleName = req.user.role_name;

    const notifications = await db.query(`
      SELECT * FROM system_notifications
      WHERE (user_id = ? OR role_target = ? OR role_target = 'ALL')
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId, roleName]);

    const unreadCountRow = await db.get(`
      SELECT COUNT(*) as unread_count 
      FROM system_notifications
      WHERE is_read = 0 AND (user_id = ? OR role_target = ? OR role_target = 'ALL')
    `, [userId, roleName]);

    res.json({
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        desc: n.message,
        message: n.message,
        type: n.type,
        time: n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent',
        created_at: n.created_at,
        unread: !n.is_read,
        is_read: Boolean(n.is_read),
        link_view: n.link_view
      })),
      unread_count: unreadCountRow?.unread_count || 0
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 2. Mark specific notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.run('UPDATE system_notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// 3. Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const roleName = req.user.role_name;

    await db.run(`
      UPDATE system_notifications 
      SET is_read = 1 
      WHERE (user_id = ? OR role_target = ? OR role_target = 'ALL')
    `, [userId, roleName]);

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

export default router;

