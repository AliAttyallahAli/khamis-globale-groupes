// frontend/src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { notificationsApi } from '../api/notifications.api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charge initiale
  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationsApi.list({ limit: 30 });
      setNotifications(data.data || []);
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.warn('Erreur chargement notifications', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Écoute temps réel
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notif) => {
      // Ajout en tête
      setNotifications((prev) => [
        { ...notif, is_read: 0, created_at: notif.timestamp || new Date().toISOString() },
        ...prev,
      ]);
      setUnreadCount((c) => c + 1);

      // Toast
      const type = notif.type || 'info';
      const msg = notif.message || notif.title || 'Nouvelle notification';
      if (type === 'success') toast.success(msg);
      else if (type === 'warning') toast(msg, { icon: '⚠️' });
      else if (type === 'error') toast.error(msg);
      else toast(msg, { icon: 'ℹ️' });
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn(err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.warn(err);
    }
  }, []);

  const remove = useCallback(async (id) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.warn(err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refresh,
        markRead,
        markAllRead,
        remove,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}