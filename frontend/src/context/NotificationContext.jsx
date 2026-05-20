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
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!user) return;

    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(`${WS_ROOT}/ws/notifications/?token=${token}`);

    ws.onopen = () => {
      console.log('Notification WS connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'unread_count') {
        setUnreadCount(data.count);
      } else if (data.type === 'notification') {
        setNotifications(prev => [data, ...prev].slice(0, 20));
        setUnreadCount(data.unread_count);
        
        // Show toast for new notification
        toast.success(data.title, {
          description: data.message,
          duration: 5000,
        });
      }
    };

    ws.onclose = () => {
      console.log('Notification WS disconnected. Reconnecting...');
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = (err) => {
      console.error('Notification WS error', err);
      ws.close();
    };

    setSocket(ws);
  }, [user]);

  useEffect(() => {
    connect();
    return () => {
      if (socket) socket.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
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
