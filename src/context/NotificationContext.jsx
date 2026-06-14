import { createContext, useState, useCallback, useContext, useEffect } from 'react';

/**
 * Notification Context
 * Manages toast notifications globally
 */
const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const notification = { id, message, type };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after duration (0 = no auto-remove)
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

/**
 * In-App Notification Context for Database Notifications
 */
const InAppNotificationContext = createContext();

export function InAppNotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch only once on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <InAppNotificationContext.Provider value={{ unreadCount, setUnreadCount, fetchUnreadCount }}>
      {children}
    </InAppNotificationContext.Provider>
  );
}

export function useInAppNotification() {
  const context = useContext(InAppNotificationContext);
  if (!context) {
    throw new Error('useInAppNotification must be used within InAppNotificationProvider');
  }
  return context;
}
