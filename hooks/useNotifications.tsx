
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationMessage } from '../types';
import { getNotificationsForUser, markNotificationAsRead, addNotification as apiAddNotification } from '../services/api'; // Renamed addNotification to avoid conflict
import { useAuth } from './useAuth';

interface NotificationsContextType {
  notifications: NotificationMessage[];
  unreadCount: number;
  addNotification: (message: Omit<NotificationMessage, 'id' | 'userId' | 'createdAt' | 'isRead'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, getToken } = useAuth(); // Added getToken
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    const token = getToken();
    if (!token) {
      console.warn("No token for fetching notifications.");
      return;
    }
    setLoading(true);
    try {
      const userNotifications = await getNotificationsForUser(currentUser.id, token);
      setNotifications(userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getToken]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    } else {
      setNotifications([]); // Clear notifications if no user
    }
  }, [currentUser, fetchNotifications]);

  // This function is for the context, allowing components to call `addNotification`
  // It then calls the `apiAddNotification` function from `services/api.ts`
  const addNotificationInternal = async (messageData: Omit<NotificationMessage, 'id' | 'userId' | 'createdAt' | 'isRead'>) => {
    if (!currentUser) return;
    const token = getToken();
    if (!token) {
        console.warn("No token for adding notification.");
        return;
    }
    try {
      // Backend handles associating notification with the current user via token or explicitly passed userId.
      // The `apiAddNotification` from `services/api.ts` should handle this.
      // Assuming the backend creates the notification for the user identified by the token,
      // or if `userId` is required in payload, `services/api.ts` should add it.
      // The Omit type for messageData already excludes userId, assuming backend deduces it or api.ts adds it.
      const newNotification = await apiAddNotification({ ...messageData, userId: currentUser.id }, token); // Pass token
      if (newNotification) {
        setNotifications(prev => [newNotification, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (error) {
      console.error("Failed to add notification:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const token = getToken();
    if (!token) {
        console.warn("No token for marking notification as read.");
        return;
    }
    try {
      const success = await markNotificationAsRead(notificationId, token); // Pass token
      if (success) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    const token = getToken();
    if (!token) {
        console.warn("No token for marking all notifications as read.");
        return;
    }
    try {
      // Backend should ideally support a "mark all as read" endpoint.
      // Simulating by marking each unread notification individually if no such endpoint.
      const unreadNotifications = notifications.filter(n => !n.isRead);
      let allSucceeded = true;
      for (const notification of unreadNotifications) {
        const success = await markNotificationAsRead(notification.id, token); // Pass token
        if (!success) {
          allSucceeded = false;
          console.error(`Failed to mark notification ${notification.id} as read.`);
          // Optionally break or collect errors
        }
      }
      if (allSucceeded) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification: addNotificationInternal, markAsRead, markAllAsRead, fetchNotifications, loading }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
