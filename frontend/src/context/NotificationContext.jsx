import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { WS_ROOT } from '../utils/api';
import { getStoredUser } from '../utils/auth';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const user = getStoredUser();
  const userId = user?.id;
  const reconnectTimeoutRef = useRef(null);

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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'unread_count') {
          setUnreadCount(data.count);
        } else if (data.type === 'notification') {
          setNotifications(prev => [data, ...prev].slice(0, 20));
          setUnreadCount(data.unread_count);
          
          toast.success(data.title, {
            description: data.message,
            duration: 5000,
          });
        }
      } catch (err) {
        console.error('Error parsing notification message', err);
      }
    };

    ws.onclose = (e) => {
      console.log('Notification WS disconnected', e.code, e.reason);
      // Only reconnect if not closed normally
      if (e.code !== 1000 && e.code !== 1001) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    };

    ws.onerror = (err) => {
      console.error('Notification WS error', err);
    };

    setSocket(ws);
  }, [userId, socket]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      // We don't necessarily want to close it here if the component re-renders
      // but if the provider unmounts, we should.
    };
  }, [connect]);

  const value = {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    socket
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
