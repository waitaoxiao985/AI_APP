interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  action?: string;
  actionData?: any;
}

const NOTIFICATIONS_KEY = 'ai-knowledge-base-notifications';

class NotificationService {
  private notifications: Notification[] = [];

  constructor() {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  private saveNotifications(): void {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  getAllNotifications(): Notification[] {
    return this.notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString()
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    return newNotification;
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.saveNotifications();
  }

  deleteNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
  }

  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  // 生成系统通知的便捷方法
  createSuccessNotification(title: string, message: string, action?: string, actionData?: any): Notification {
    return this.addNotification({ title, message, type: 'success', action, actionData });
  }

  createInfoNotification(title: string, message: string, action?: string, actionData?: any): Notification {
    return this.addNotification({ title, message, type: 'info', action, actionData });
  }

  createWarningNotification(title: string, message: string, action?: string, actionData?: any): Notification {
    return this.addNotification({ title, message, type: 'warning', action, actionData });
  }

  createErrorNotification(title: string, message: string, action?: string, actionData?: any): Notification {
    return this.addNotification({ title, message, type: 'error', action, actionData });
  }
}

export const notificationService = new NotificationService();
export type { Notification };