import React, { useState, useEffect, useCallback } from 'react';
import { notification, Badge } from 'antd';
import { 
  BellOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined,
  BellFilled
} from '@ant-design/icons';
import { 
  NotificationPreference, 
  NotificationType, 
  NotificationMessage,
  NotificationMessageMap,
  ExecutionStatus
} from '../types';
import { 
  getAllNotificationMessagesFromLocalStorage,
  saveNotificationMessageToLocalStorage,
  removeNotificationMessageFromLocalStorage,
  clearAllNotificationMessagesFromLocalStorage,
  getNotificationPreferencesFromLocalStorage
} from '../utils/storage';

interface NotificationManagerProps {
  children?: React.ReactNode;
}

/**
 * Component for managing and displaying notifications
 */
const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<NotificationPreference>({
    enabled: true,
    showSuccess: true,
    showError: true,
    showWarning: true,
    showInfo: true,
    desktop: true,
    sound: true,
    soundVolume: 50
  });
  
  const [messages, setMessages] = useState<NotificationMessageMap>({});
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Load notification preferences and messages
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getNotificationPreferencesFromLocalStorage();
        setPreferences(prefs);
      } catch (error) {
        console.error('Error loading notification preferences:', error);
      }
    };
    
    const loadMessages = async () => {
      try {
        const msgs = await getAllNotificationMessagesFromLocalStorage();
        setMessages(msgs);
        
        // Count unread messages
        const unread = Object.values(msgs).filter(msg => !msg.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error loading notification messages:', error);
      }
    };
    
    loadPreferences();
    loadMessages();
    
    // Set up interval to refresh messages
    const interval = setInterval(() => {
      loadMessages();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Show notification
  const showNotification = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    scenarioId?: string,
    executionId?: string
  ) => {
    // Check if notifications are enabled
    if (!preferences.enabled) {
      return;
    }
    
    // Check if this type of notification is enabled
    switch (type) {
      case NotificationType.SUCCESS:
        if (!preferences.showSuccess) return;
        break;
      case NotificationType.ERROR:
        if (!preferences.showError) return;
        break;
      case NotificationType.WARNING:
        if (!preferences.showWarning) return;
        break;
      case NotificationType.INFO:
        if (!preferences.showInfo) return;
        break;
    }
    
    // Create notification message
    const notificationMessage: NotificationMessage = {
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      scenarioId,
      executionId,
      read: false
    };
    
    // Save notification message
    try {
      const id = `notification_${Date.now()}`;
      await saveNotificationMessageToLocalStorage(id, notificationMessage);
      
      // Update messages state
      setMessages(prev => ({
        ...prev,
        [id]: notificationMessage
      }));
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show notification in UI
      const notificationConfig = {
        message: title,
        description: message,
        duration: 4.5,
        icon: getNotificationIcon(type)
      };
      
      notification.open(notificationConfig);
      
      // Show desktop notification if enabled
      if (preferences.desktop && 'Notification' in window) {
        try {
          // Check if we have permission
          if (Notification.permission === 'granted') {
            new Notification(title, {
              body: message,
              icon: '/icon-128.png'
            });
          } else if (Notification.permission !== 'denied') {
            // Request permission
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification(title, {
                  body: message,
                  icon: '/icon-128.png'
                });
              }
            });
          }
        } catch (error) {
          console.error('Error showing desktop notification:', error);
        }
      }
      
      // Play sound if enabled
      if (preferences.sound) {
        try {
          const audio = new Audio('/notification-sound.mp3');
          audio.volume = preferences.soundVolume / 100;
          audio.play().catch(error => {
            console.error('Error playing notification sound:', error);
          });
        } catch (error) {
          console.error('Error playing notification sound:', error);
        }
      }
    } catch (error) {
      console.error('Error saving notification message:', error);
    }
  }, [preferences]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const message = messages[id];
      if (!message) return;
      
      const updatedMessage = { ...message, read: true };
      await saveNotificationMessageToLocalStorage(id, updatedMessage);
      
      // Update messages state
      setMessages(prev => ({
        ...prev,
        [id]: updatedMessage
      }));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [messages]);
  
  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const updatedMessages = { ...messages };
      
      // Update all messages
      for (const id in updatedMessages) {
        updatedMessages[id] = { ...updatedMessages[id], read: true };
        await saveNotificationMessageToLocalStorage(id, updatedMessages[id]);
      }
      
      // Update messages state
      setMessages(updatedMessages);
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [messages]);
  
  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await removeNotificationMessageFromLocalStorage(id);
      
      // Update messages state
      const updatedMessages = { ...messages };
      const wasUnread = updatedMessages[id] && !updatedMessages[id].read;
      delete updatedMessages[id];
      setMessages(updatedMessages);
      
      // Update unread count if necessary
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [messages]);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await clearAllNotificationMessagesFromLocalStorage();
      
      // Update messages state
      setMessages({});
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, []);
  
  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case NotificationType.ERROR:
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case NotificationType.WARNING:
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case NotificationType.INFO:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <BellOutlined />;
    }
  };
  
  // Notify about execution status
  const notifyExecutionStatus = useCallback((
    status: ExecutionStatus,
    scenarioTitle: string,
    scenarioId: string,
    executionId: string,
    error?: string
  ) => {
    switch (status) {
      case ExecutionStatus.SUCCESS:
        showNotification(
          NotificationType.SUCCESS,
          'Execution Completed',
          `Scenario "${scenarioTitle}" executed successfully.`,
          scenarioId,
          executionId
        );
        break;
      case ExecutionStatus.ERROR:
        showNotification(
          NotificationType.ERROR,
          'Execution Failed',
          `Scenario "${scenarioTitle}" failed: ${error || 'Unknown error'}`,
          scenarioId,
          executionId
        );
        break;
      case ExecutionStatus.WARNING:
        showNotification(
          NotificationType.WARNING,
          'Execution Warning',
          `Scenario "${scenarioTitle}" completed with warnings.`,
          scenarioId,
          executionId
        );
        break;
      case ExecutionStatus.CANCELLED:
        showNotification(
          NotificationType.INFO,
          'Execution Cancelled',
          `Scenario "${scenarioTitle}" execution was cancelled.`,
          scenarioId,
          executionId
        );
        break;
      default:
        break;
    }
  }, [showNotification]);
  
  // Create notification context
  const notificationContext = {
    preferences,
    messages,
    unreadCount,
    showNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    notifyExecutionStatus
  };
  
  return (
    <NotificationContext.Provider value={notificationContext}>
      {children}
    </NotificationContext.Provider>
  );
};

// Create notification context
export const NotificationContext = React.createContext<{
  preferences: NotificationPreference;
  messages: NotificationMessageMap;
  unreadCount: number;
  showNotification: (
    type: NotificationType,
    title: string,
    message: string,
    scenarioId?: string,
    executionId?: string
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  notifyExecutionStatus: (
    status: ExecutionStatus,
    scenarioTitle: string,
    scenarioId: string,
    executionId: string,
    error?: string
  ) => void;
}>({
  preferences: {
    enabled: true,
    showSuccess: true,
    showError: true,
    showWarning: true,
    showInfo: true,
    desktop: true,
    sound: true,
    soundVolume: 50
  },
  messages: {},
  unreadCount: 0,
  showNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  clearAllNotifications: () => {},
  notifyExecutionStatus: () => {}
});

// Custom hook for using notification context
export const useNotifications = () => React.useContext(NotificationContext);

// Notification Bell component
export const NotificationBell: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { unreadCount } = useNotifications();
  
  return (
    <Badge count={unreadCount} size="small">
      <BellFilled 
        style={{ fontSize: '20px', cursor: 'pointer' }} 
        onClick={onClick}
      />
    </Badge>
  );
};

export default NotificationManager;