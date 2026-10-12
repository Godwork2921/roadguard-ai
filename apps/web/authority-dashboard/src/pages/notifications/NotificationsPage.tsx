import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  Navigation,
  Shield,
  Cloud,
  CheckCheck,
  CheckCircle2,
  Info,
  Wrench,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/layout/page-container';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { NotificationType, NotificationPriority } from '@/types';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  priority: NotificationPriority;
  createdAt: string;
  dateGroup: string;
}

const notificationTypes: Record<string, { icon: React.ElementType; color: string }> = {
  HAZARD_ALERT: { icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
  ROUTE_ALERT: { icon: Navigation, color: 'text-blue-500 bg-blue-500/10' },
  WEATHER_ALERT: { icon: Cloud, color: 'text-cyan-500 bg-cyan-500/10' },
  HAZARD_RESOLVED: { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
  SAFETY_TIP: { icon: Shield, color: 'text-primary bg-primary/10' },
  SYSTEM_ANNOUNCEMENT: { icon: Info, color: 'text-purple-500 bg-purple-500/10' },
  AUTHORITY_ALERT: { icon: Wrench, color: 'text-amber-500 bg-amber-500/10' },
  ANOMALY_DETECTED: { icon: Zap, color: 'text-orange-500 bg-orange-500/10' },
};

const generateNotifications = (): NotificationItem[] => {
  const notifications: NotificationItem[] = [];
  const now = Date.now();

  const items: Omit<NotificationItem, 'id' | 'dateGroup'>[] = [
    { type: 'HAZARD_ALERT', title: 'Critical hazard ahead', message: 'Flooding reported on River Road, 0.3 km ahead. Consider alternative route.', isRead: false, priority: 'URGENT', createdAt: new Date(now - 600000).toISOString() },
    { type: 'ROUTE_ALERT', title: 'Route safety update', message: 'Your planned route to Airport has a new hazard warning.', isRead: false, priority: 'HIGH', createdAt: new Date(now - 1800000).toISOString() },
    { type: 'WEATHER_ALERT', title: 'Heavy rain warning', message: 'Heavy rainfall expected in your area. Drive carefully.', isRead: false, priority: 'MEDIUM', createdAt: new Date(now - 3600000).toISOString() },
    { type: 'HAZARD_RESOLVED', title: 'Hazard resolved', message: 'Pothole on Broadway has been repaired and marked as resolved.', isRead: true, priority: 'LOW', createdAt: new Date(now - 7200000).toISOString() },
    { type: 'SAFETY_TIP', title: 'Safety tip of the day', message: 'Maintain at least 3 seconds following distance in good conditions.', isRead: true, priority: 'LOW', createdAt: new Date(now - 14400000).toISOString() },
    { type: 'ANOMALY_DETECTED', title: 'Driving anomaly detected', message: 'Harsh braking detected on your last trip. Check your driving report.', isRead: false, priority: 'MEDIUM', createdAt: new Date(now - 86400000).toISOString() },
    { type: 'AUTHORITY_ALERT', title: 'Maintenance update', message: 'Road repair scheduled on 5th Ave from Jul 16-18. Expect delays.', isRead: false, priority: 'HIGH', createdAt: new Date(now - 172800000).toISOString() },
    { type: 'SYSTEM_ANNOUNCEMENT', title: 'New feature available', message: 'Offline mode is now available. You can now report hazards without internet.', isRead: true, priority: 'LOW', createdAt: new Date(now - 259200000).toISOString() },
    { type: 'HAZARD_ALERT', title: 'Multiple hazards on your route', message: '3 hazards detected on Broadway between 14th and 23rd St.', isRead: true, priority: 'MEDIUM', createdAt: new Date(now - 345600000).toISOString() },
  ];

  items.forEach((item, idx) => {
    const hoursAgo = (now - new Date(item.createdAt).getTime()) / 3600000;
    let group: string;
    if (hoursAgo < 24) group = 'Today';
    else if (hoursAgo < 48) group = 'Yesterday';
    else if (hoursAgo < 168) group = 'This Week';
    else group = 'Earlier';
    notifications.push({ ...item, id: `notif-${idx}`, dateGroup: group });
  });

  return notifications;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState(generateNotifications());
  const [filter, setFilter] = React.useState('all');

  const groupedNotifs = React.useMemo(() => {
    let filtered = notifications;
    if (filter === 'unread') filtered = notifications.filter((n) => !n.isRead);
    else if (filter !== 'all') filtered = notifications.filter((n) => n.type === filter);

    const groups: Record<string, NotificationItem[]> = {};
    filtered.forEach((n) => {
      if (!groups[n.dateGroup]) groups[n.dateGroup] = [];
      groups[n.dateGroup]?.push(n);
    });
    return groups;
  }, [notifications, filter]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageContainer
      title="Notifications"
      description={`${unreadCount} unread notifications`}
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="HAZARD_ALERT">Hazard Alerts</SelectItem>
              <SelectItem value="ROUTE_ALERT">Route Alerts</SelectItem>
              <SelectItem value="SYSTEM_ANNOUNCEMENT">Announcements</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {Object.entries(groupedNotifs).map(([group, items]) => (
          <div key={group}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {group}
            </h3>
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {items.map((notification, idx) => {
                  const meta = notificationTypes[notification.type] || { icon: Bell, color: 'text-muted-foreground bg-muted' };
                  const Icon = meta.icon;

                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -100, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors',
                        notification.isRead ? 'hover:bg-muted/30' : 'bg-primary/5 hover:bg-primary/10'
                      )}
                      onClick={() => toggleRead(notification.id)}
                    >
                      <div className={cn('p-2 rounded-lg shrink-0', meta.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm',
                            notification.isRead ? 'font-normal' : 'font-semibold'
                          )}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {notification.priority === 'URGENT' && (
                              <Badge variant="critical" className="text-[9px] px-1.5 py-0">URGENT</Badge>
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className={cn(
                          'text-sm mt-0.5',
                          notification.isRead ? 'text-muted-foreground' : 'text-foreground/80'
                        )}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {Object.keys(groupedNotifs).length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground/60">You&apos;re all caught up!</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
