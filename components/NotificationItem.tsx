import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Bell, BookOpen, Clock, GraduationCap } from "lucide-react";

interface NotificationItemProps {
  notification: {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  };
  onMarkAsRead: (id: number) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "DEADLINE_WARNING":
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case "STUDY_PLAN":
      return <BookOpen className="h-5 w-5 text-blue-500" />;
    case "COURSE_UPDATE":
      return <GraduationCap className="h-5 w-5 text-green-500" />;
    case "ASSIGNMENT":
      return <Clock className="h-5 w-5 text-red-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

export default function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={`flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-colors ${
        notification.isRead ? "border-gray-200 bg-gray-50" : "border-blue-200 bg-white hover:bg-blue-50"
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick();
        }
      }}
    >
      <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.type)}</div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-medium ${notification.isRead ? "text-gray-600" : "text-gray-900"}`}>
            {notification.title}
          </h3>
          {!notification.isRead && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
        </div>

        <p className={`mt-1 text-sm ${notification.isRead ? "text-gray-500" : "text-gray-700"}`}>
          {notification.message}
        </p>

        <p className="mt-2 text-xs text-gray-400">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
