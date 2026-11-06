import EventEmitter from 'events';

class SyncBus extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
    this.keepAliveInterval = null;
    this.startKeepAlive();
  }

  startKeepAlive() {
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    // Send lightweight ping every 25 seconds to keep SSE streams alive through all proxies
    this.keepAliveInterval = setInterval(() => {
      this.broadcast('ping', { timestamp: Date.now() });
    }, 25000);
    if (this.keepAliveInterval.unref) this.keepAliveInterval.unref();
  }

  /**
   * Register a new SSE response client
   */
  addClient(res, user = null) {
    const client = {
      id: Math.random().toString(36).substring(2, 10),
      res,
      user,
      connectedAt: Date.now()
    };

    this.clients.add(client);

    // Initial handshake message
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: client.id, message: 'Real-time synchronization active' })}\n\n`);

    res.on('close', () => {
      this.clients.delete(client);
    });

    return client.id;
  }

  /**
   * Remove a client manually
   */
  removeClient(res) {
    for (const client of this.clients) {
      if (client.res === res) {
        this.clients.delete(client);
        break;
      }
    }
  }

  /**
   * Broadcast an event to all connected clients (or matching role/userId)
   * @param {string} eventType e.g. 'APPLICATION_CREATED', 'JOB_CREATED', 'STUDENT_PROFILE_UPDATED'
   * @param {object} payload
   * @param {string} [targetRole] 'STUDENT', 'T_AND_P', 'HOD', or null for all
   * @param {string} [targetUserId] specific user ID or null for all
   */
  broadcast(eventType, payload = {}, targetRole = null, targetUserId = null) {
    const messageData = JSON.stringify({
      type: eventType,
      payload,
      timestamp: Date.now()
    });

    const sseMessage = `event: mutation\ndata: ${messageData}\n\n`;

    for (const client of this.clients) {
      try {
        if (targetRole && client.user?.role_name && client.user.role_name !== targetRole && client.user.role_name !== 'T_AND_P') {
          // If targeted to a specific role, skip non-matching unless T&P admin
          continue;
        }
        if (targetUserId && client.user?.id && client.user.id !== targetUserId) {
          continue;
        }
        client.res.write(sseMessage);
      } catch (err) {
        console.error('Error writing to SSE client:', err.message);
        this.clients.delete(client);
      }
    }

    // Also emit internally so server-side subscribers can react
    this.emit('mutation', { type: eventType, payload });
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const syncBus = new SyncBus();
export default syncBus;

