
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationMessage } from '../types';
import { getNotificationsForUserMock, markNotificationAsReadMock, addNotificationMock } from '../services/api';
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
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userNotifications = await getNotificationsForUserMock(currentUser.id);
      setNotifications(userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    } else {
      setNotifications([]); // Clear notifications if no user
    }
  }, [currentUser, fetchNotifications]);

  const addNotification = async (messageData: Omit<NotificationMessage, 'id' | 'userId' | 'createdAt' | 'isRead'>) => {
    if (!currentUser) return;
    try {
      // This addNotificationMock should target the current user in a real system.
      // For mock, it might just add to a global list and then filter.
      // Or, the mock function itself can take userId.
      const newNotification = await addNotificationMock({ ...messageData, userId: currentUser.id });
      if (newNotification) {
        setNotifications(prev => [newNotification, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (error) {
      console.error("Failed to add notification:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsReadMock(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      // Mock this by iterating or having a specific mock function
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      for (const id of unreadIds) {
        await markNotificationAsReadMock(id);
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, fetchNotifications, loading }}>
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
