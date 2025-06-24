"use client";

import { Bell, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/utils/cn";

import NotificationItem from "./NotificationItem";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching unread count:", error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=20");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen, notifications.length, fetchNotifications]);

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: true } : notification,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error marking all notifications as read:", error);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        type="button"
        className={cn(
          "relative rounded-full bg-white p-2 text-gray-600 ring-2",
          "hover:bg-gray-50 hover:text-gray-900",
          "focus:ring-blue-500 focus:outline-none",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full",
              "bg-red-500 text-xs font-medium text-white",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div
          className={cn(
            "ring-opacity-5 absolute top-12 right-0 z-50 max-h-96 w-96",
            "overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black",
          )}
        >
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800">
                    Mark all read
                  </button>
                )}
                <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2">No notifications yet</p>
              </div>
            )}
            {!loading && notifications.length > 0 && (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} onMarkAsRead={markAsRead} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
