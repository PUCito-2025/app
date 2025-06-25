"use client";

import { Bell, Check, Clock, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: "REMINDER" | "STUDY_PLAN" | "ASSIGNMENT";
  title: string;
  message: string;
  isRead: boolean;
  deliveryType: "EMAIL" | "IN_APP";
  status: "PENDING" | "SENT" | "FAILED" | "DELIVERED";
  createdAt: string;
  sentAt?: string;
  metadata?: any;
}

export default function NotificationPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif)),
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Open modal with full content
    setSelectedNotification(notification);
    setModalOpen(true);
    setOpen(false); // Close popover
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/clear", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "STUDY_PLAN":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "ASSIGNMENT":
        return <Mail className="h-4 w-4 text-orange-500" />;
      case "REMINDER":
        return <Bell className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, deliveryType: string) => {
    const variant =
      status === "DELIVERED"
        ? "default"
        : status === "SENT"
          ? "secondary"
          : status === "FAILED"
            ? "destructive"
            : "outline";

    const translatedStatus =
      {
        PENDING: "Pendiente",
        SENT: "Enviado",
        FAILED: "Fallido",
        DELIVERED: "Entregado",
      }[status] || status;

    return (
      <Badge variant={variant} className="text-xs">
        {deliveryType === "EMAIL" ? "📧" : "📱"} {translatedStatus}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      // If less than 5 minutes, show "Hace unos minutos"
      if (diffInHours < 5 / 60) return "Hace unos minutos";
      return `Hace ${Math.floor(diffInHours * 60)} minutos`;
    } else if (diffInHours < 24) {
      return `Hace ${Math.floor(diffInHours)} horas`;
    } else {
      return date.toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Marcar todas como vistas
              </Button>
            )}
          </div>
          {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} sin leer</p>}
        </div>

        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Cargando notificaciones...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <h4 className="truncate text-sm font-medium text-gray-900">{notification.title}</h4>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="ml-2 h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <p className="mb-2 line-clamp-2 text-xs text-gray-600">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.sentAt || notification.createdAt)}
                        </span>
                        {getStatusBadge(notification.status, notification.deliveryType)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>

      {/* Notification Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="h-[70vh] w-[50%] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {selectedNotification && getNotificationIcon(selectedNotification.type)}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-gray-900">{selectedNotification?.title}</DialogTitle>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedNotification && formatDate(selectedNotification.sentAt || selectedNotification.createdAt)}
                  </span>
                  {selectedNotification &&
                    getStatusBadge(selectedNotification.status, selectedNotification.deliveryType)}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex-grow overflow-y-auto pr-4">
            <h4 className="mb-2 text-sm font-medium text-gray-700">Mensaje</h4>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                {selectedNotification?.message}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-xs text-gray-500">
              Tipo: {selectedNotification?.type} • Entrega:{" "}
              {selectedNotification?.deliveryType === "EMAIL" ? "Email" : "En la app"}
            </div>
            {selectedNotification && !selectedNotification.isRead && (
              <Button
                size="sm"
                onClick={() => {
                  if (selectedNotification) {
                    markAsRead(selectedNotification.id);
                    setSelectedNotification({ ...selectedNotification, isRead: true });
                  }
                }}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Marcar como leída
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}
