import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const SyncContext = createContext({
  syncVersion: 0,
  lastEvent: null,
  notifyMutation: () => {}
});

export function SyncProvider({ children }) {
  const { user, token } = useAuth();
  const [syncVersion, setSyncVersion] = useState(1);
  const [lastEvent, setLastEvent] = useState(null);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  // Cross-tab broadcast channel for local instant updates across multiple tabs
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('jobmatch_sync_channel');
        broadcastChannelRef.current = bc;
        bc.onmessage = (msg) => {
          if (msg && msg.data) {
            setLastEvent(msg.data);
            setSyncVersion(v => v + 1);
          }
        };
      } catch (e) {
        // BroadcastChannel unavailable
      }
    }
    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Server-Sent Events (SSE) connection
  useEffect(() => {
    let isCancelled = false;

    function connectSSE() {
      if (isCancelled) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const streamUrl = token 
        ? `/api/sync/stream?token=${encodeURIComponent(token)}` 
        : '/api/sync/stream';

      try {
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.addEventListener('mutation', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastEvent(data);
            setSyncVersion(v => v + 1);
          } catch (parseErr) {
            console.error('SSE parse error:', parseErr);
          }
        });

        es.onerror = () => {
          es.close();
          // Exponential / delayed reconnection
          if (!isCancelled) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(connectSSE, 4000);
          }
        };
      } catch (err) {
        console.warn('Failed to establish EventSource connection:', err);
      }
    }

    connectSSE();

    // Invalidate & refresh on window focus (guarantees freshness when user switches tabs)
    function handleWindowFocus() {
      setSyncVersion(v => v + 1);
    }
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isCancelled = true;
      clearTimeout(reconnectTimeoutRef.current);
      window.removeEventListener('focus', handleWindowFocus);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [token]);

  /**
   * Helper to manually trigger a local mutation sync across all tabs
   */
  const notifyMutation = useCallback((type, payload = {}) => {
    const eventObj = { type, payload, timestamp: Date.now() };
    setLastEvent(eventObj);
    setSyncVersion(v => v + 1);
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(eventObj);
      } catch (e) {}
    }
  }, []);

  return (
    <SyncContext.Provider value={{ syncVersion, lastEvent, notifyMutation }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useDataSync() {
  return useContext(SyncContext);
}

export default SyncContext;

