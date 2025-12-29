import React, { useState, useEffect } from "react";
import {
  Notification,
  NotificationType,
  NotificationStatus,
  UserRole,
} from "@/types";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  AlertCircle,
  Calendar,
  FileText,
  Shield,
  Wrench,
  CheckCircle,
  CircleOff,
  Smartphone, Info, UserRoundPlus, BatteryLow, ClockAlert, Link2Off,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { morph, notificationTypeToRu } from "@/translations/ru.ts";

const notificationIcons: {
  [NotificationType.CONTRACT_CREATION]: React.JSX.Element
  [NotificationType.CONTRACT_STATUS_UPDATE]: React.JSX.Element
  [NotificationType.PUNISHMENT_TASK_CREATION]: React.JSX.Element
  [NotificationType.DEVICE_CHANGE_TASK_CREATION]: React.JSX.Element
  [NotificationType.TASK_CANCELLED]: React.JSX.Element
  [NotificationType.NEW_CLIENT_ASSIGNED]: React.JSX.Element
  [NotificationType.DEVICE_OFF]: React.JSX.Element
  [NotificationType.DEVICE_INACTIVE]: React.JSX.Element
  [NotificationType.DEVICE_LOW_BATTERY]: React.JSX.Element
  [NotificationType.CONTRACT_OUTDATED]: React.JSX.Element
} = {
  [NotificationType.CONTRACT_CREATION]: <FileText className="h-4 w-4" />,
  [NotificationType.CONTRACT_STATUS_UPDATE]: <AlertCircle className="h-4 w-4" />,
  [NotificationType.PUNISHMENT_TASK_CREATION]: <CheckCircle className="h-4 w-4" />,
  [NotificationType.DEVICE_CHANGE_TASK_CREATION]: <Smartphone className="h-4 w-4" />,
  [NotificationType.TASK_CANCELLED]: <CircleOff className="h-4 w-4" />,
  [NotificationType.NEW_CLIENT_ASSIGNED]: <UserRoundPlus className="h-4 w-4"/>,
  [NotificationType.DEVICE_OFF]: <CircleOff className="h-4 w-4"/>,
  [NotificationType.DEVICE_INACTIVE]: <Link2Off className="h-4 w-4"/>,
  [NotificationType.DEVICE_LOW_BATTERY]: <BatteryLow className="h-4 w-4"/>,
  [NotificationType.CONTRACT_OUTDATED]: <ClockAlert className="h-4 w-4"/>
};

export function NotificationCenter() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Build query parameters based on user role
      const params = new URLSearchParams();

      if (user.role === UserRole.CLIENT) {
        params.append("clientId", user.id);
      } else if (user.role === UserRole.MANAGER) {
        params.append("managerId", user.id);
      } else if (
        user.role === UserRole.SURVEILLANCE_OFFICER ||
        user.role === UserRole.CORRECTIONS_OFFICER
      ) {
        params.append("workerId", user.id);
      }

      const response = await apiClient.get<Notification[]>(
        `/notifications/filtered?${params.toString()}`,
      );
      setNotifications(response);
      setUnreadCount(response.filter((n) => n.status === "UNREAD").length);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}`, {
        status: "READ",
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: NotificationStatus.READ }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Не удалось отметить уведомление как прочитанное:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read individually since there's no bulk endpoint
      await Promise.all(
        notifications
          .filter((n) => n.status === "UNREAD")
          .map((n) =>
            apiClient.patch(`/notifications/${n.id}`, { status: "READ" }),
          ),
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: NotificationStatus.READ })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Не удалось отметить все уведомления как прочитанные:", error);
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CONTRACT_CREATION:
        return "text-blue-600 bg-blue-50";
      case NotificationType.CONTRACT_STATUS_UPDATE:
        return "text-blue-600 bg-blue-50";
      case NotificationType.PUNISHMENT_TASK_CREATION:
      case NotificationType.DEVICE_LOW_BATTERY:
        return "text-red-600 bg-orange-50";
      case NotificationType.TASK_CANCELLED:
      case NotificationType.CONTRACT_OUTDATED:
      case NotificationType.DEVICE_INACTIVE:
      case NotificationType.DEVICE_OFF:
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
    if (diffMinutes < 1) {
      return t("notifications.justNow");
    } else if (diffMinutes < 60) {
      return rtf.format(-diffMinutes, 'minute')
    } else if (diffHours < 24) {
      return rtf.format(-diffHours, 'hour')
    } else if (diffDays < 7) {
      return rtf.format(-diffDays, 'day')
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button id={"notifications-center-popup"} variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                {t("notifications.markAllAsRead")}
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {t("notifications.noNotifications")}
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors",
                    notification.status === "UNREAD" && "bg-muted/20",
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={cn(
                        "flex-shrink-0 p-1 rounded-full",
                        getTypeColor(notification.type),
                      )}
                    >
                      {notificationIcons[notification.type] ? notificationIcons[notification.type] : <Info className="h-4 w-4"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            notification.status === "UNREAD" && "font-semibold",
                          )}
                        >
                          {notificationTypeToRu(notification.type)}
                        </p>
                        {notification.status === "UNREAD" && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
