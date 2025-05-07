'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase, getNotifications, markNotificationAsRead, subscribeToNotifications } from '@/lib/supabase';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  created_at: string;
};

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch notifications on component mount
    const fetchNotifications = async () => {
      const notificationsData = await getNotifications(userId);
      setNotifications(notificationsData);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = subscribeToNotifications(userId, (payload) => {
      const newNotification = payload.new as Notification;
      setNotifications(prev => [newNotification, ...prev]);
    });

    return () => {
      // Unsubscribe when component unmounts
      subscription.then(sub => sub.unsubscribe());
    };
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notificationId: string, link?: string) => {
    await markNotificationAsRead(notificationId);
    
    // Update the local state to mark the notification as read
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    ));

    // Navigate to the link if provided
    if (link) {
      window.location.href = link;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="relative">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 font-semibold border-b">Notifications</div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 border-b cursor-pointer ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                onClick={() => handleNotificationClick(notification.id, notification.link)}
              >
                <div>
                  <div className="font-semibold">{notification.title}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
