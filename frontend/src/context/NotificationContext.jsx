import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api, { WS_ROOT } from '../utils/api';
import { getStoredUser } from '../utils/auth';
import toast from 'react-hot-toast';
import { playSound } from '../utils/sounds';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  const user = getStoredUser();
  const userId = user?.id;
  const reconnectTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastFetchedRef = useRef(0);
  // Track if we were offline so we can resync on reconnect
  const wasOfflineRef = useRef(false);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    console.log('Starting notification fallback polling...');
    setIsPolling(true);
    
    const poll = async () => {
      // Don't poll if already fetched very recently (debounce)
      if (Date.now() - lastFetchedRef.current < 10000) return;
      
      try {
        const r = await api.get('/notifications/polling/');
        setUnreadCount(r.data.unread_count);
        setNotifications(r.data.notifications);
        lastFetchedRef.current = Date.now();
      } catch (err) {
        console.warn('Polling failed', err);
      }
    };

    // Initial poll
    poll();
    
    // Set interval (30 seconds)
    pollingIntervalRef.current = setInterval(poll, 30000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('Stopping notification fallback polling...');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const connect = useCallback(() => {
    const currentUser = getStoredUser();
    if (!currentUser) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Ensure we don't have multiple connections
    if (socket && socket.readyState <= 1) return;

    const ws = new WebSocket(`${WS_ROOT}/ws/notifications/?token=${token}`);

    ws.onopen = () => {
      console.log('Notification WS connected');
      setRealtimeConnected(true);
      stopPolling(); // Real-time is back, stop polling
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // If we were offline, force a fresh fetch to resync missed notifications
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        lastFetchedRef.current = 0; // reset debounce so poll fires immediately
      }
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        } else if (data.type === 'notification') {
          setNotifications(prev => {
            // Prevent duplicate notifications
            if (prev.some(n => n.id === data.id)) return prev;
            return [data, ...prev].slice(0, 20);
          });
          setUnreadCount(data.unread_count);
          playSound(data.notification_type === 'announcement' ? 'announcement' : 'notification');
          toast.success(data.title, {
            description: data.message,
            duration: 5000,
          });
        } else if (data.type === 'moderation_alert') {
          playSound('error');
          toast.error(`NEW REPORT: ${data.data.reason}`, {
            icon: '⚠️',
            duration: 10000,
          });
        }
      } catch (err) {
        console.error('Error parsing notification message', err);
      }
    };

    ws.onclose = (e) => {
      console.log('Notification WS disconnected', e.code, e.reason);
      setRealtimeConnected(false);
      
      // Start polling as fallback
      startPolling();
      
      // Only reconnect if not closed normally (1000 = Normal Closure, 1001 = Going Away)
      if (e.code !== 1000 && e.code !== 1001) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        // Exponential-ish backoff: 10s first, then browser online event will also trigger
        reconnectTimeoutRef.current = setTimeout(connect, 10000);
      }
    };

    ws.onerror = (err) => {
      console.error('Notification WS error', err);
      setRealtimeConnected(false);
      startPolling();
      wasOfflineRef.current = true;
    };

    setSocket(ws);
  }, [userId, socket, startPolling, stopPolling]);

  // Reconnect when browser comes back online
  useEffect(() => {
    const handleOnline = () => {
      wasOfflineRef.current = true;
      if (!socket || socket.readyState > 1) {
        connect();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [connect, socket]);

  useEffect(() => {
    if (userId) {
      connect();
    } else {
      // Cleanup on logout
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setRealtimeConnected(false);
      stopPolling();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [userId]); // Only depend on userId to avoid reconnection loops

  const value = {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    socket,
    realtimeConnected,
    isPolling
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
