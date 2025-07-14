'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getUserNotifications } from '@/lib/data';
import { Notification } from '@/lib/definitions';

export default function NotificationBell({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Fetch notifications directly. Since this is static data, no useEffect is needed.
  const notifications = getUserNotifications(userId);

  const unreadCount = notifications.filter(n => !n.read && !readNotifications.has(n.id)).length;

  const handleNotificationClick = (notificationId: string, link?: string | null) => {
    setReadNotifications(prev => new Set(prev).add(notificationId));
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
                className={`p-3 border-b cursor-pointer ${
                  readNotifications.has(notification.id) || notification.read
                    ? 'bg-gray-50'
                    : 'bg-blue-50'
                }`}
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
