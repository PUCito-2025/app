import { DeliveryType, NotificationStatus, NotificationType } from "@prisma/client";

// eslint-disable-next-line import/no-named-as-default
import EmailService from "@/lib/emailService";
import prisma from "@/lib/prisma";

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  assignmentId?: number;
  studyPlanId?: number;
  deliveryType?: DeliveryType;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  userId?: string;
  isRead?: boolean;
  type?: NotificationType;
  status?: NotificationStatus;
  deliveryType?: DeliveryType;
  limit?: number;
  offset?: number;
}

interface WhereClause {
  userId?: string;
  isRead?: boolean;
  type?: NotificationType;
  status?: NotificationStatus;
  deliveryType?: DeliveryType;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async create(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          assignmentId: data.assignmentId,
          studyPlanId: data.studyPlanId,
          deliveryType: data.deliveryType,
          status: NotificationStatus.PENDING,
          metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        },
        include: {
          assignment: true,
          studyPlan: {
            include: {
              course: true,
            },
          },
        },
      });

      // Send immediately
      await this.sendNotification(notification.id);

      return notification;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with filters
   */
  static async getNotifications(filters: NotificationFilters) {
    try {
      const where: WhereClause = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.isRead !== undefined) where.isRead = filters.isRead;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.deliveryType) where.deliveryType = filters.deliveryType;

      const notifications = await prisma.notification.findMany({
        where,
        include: {
          assignment: {
            include: {
              course: true,
            },
          },
          studyPlan: {
            include: {
              course: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      });

      return notifications;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: number, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user owns the notification
        },
        data: {
          isRead: true,
        },
      });
      return notification;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      return result;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });
      return count;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  /**
   * Send a notification (actual delivery)
   */
  static async sendNotification(notificationId: number) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: {
          assignment: true,
          studyPlan: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!notification) {
        throw new Error(`Notification with id ${notificationId} not found`);
      }

      if (notification.status === NotificationStatus.SENT) {
        return notification; // Already sent
      }

      try {
        // Send based on delivery type
        switch (notification.deliveryType) {
          case DeliveryType.IN_APP:
            // In-app notifications are already "sent" when created
            break;
          case DeliveryType.EMAIL:
            await this.sendEmailNotification(notification);
            break;
          default:
            // No other delivery types supported yet
            break;
        }

        // Update notification status
        const updatedNotification = await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        return updatedNotification;
      } catch (sendError) {
        // Handle send failure
        const retryCount = notification.retryCount + 1;
        const shouldRetry = retryCount < notification.maxRetries;

        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: shouldRetry ? NotificationStatus.PENDING : NotificationStatus.FAILED,
            retryCount,
            failedAt: new Date(),
            errorMessage: sendError instanceof Error ? sendError.message : "Unknown error",
          },
        });

        if (shouldRetry) {
          // For Vercel, we'll rely on the cron job to retry failed notifications
          // eslint-disable-next-line no-console
          console.log(`Notification ${notificationId} failed, will retry via cron job`);
        }

        throw sendError;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Process failed notifications (for retry via cron)
   */
  static async processFailedNotifications() {
    try {
      const failedNotifications = await prisma.notification.findMany({
        where: {
          status: NotificationStatus.PENDING,
          retryCount: {
            lt: 3, // Max retries
          },
        },
      });

      const results = await Promise.allSettled(
        failedNotifications.map(async (notification: { id: number }) => {
          await this.sendNotification(notification.id);
          return notification.id;
        }),
      );

      const processedCount = results.filter((result) => result.status === "fulfilled").length;

      // Log failed retries
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          // eslint-disable-next-line no-console
          console.error(`Failed to retry notification ${failedNotifications[index].id}:`, result.reason);
        }
      });

      return processedCount;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error processing failed notifications:", error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(notification: {
    id: number;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
  }) {
    try {
      // Use verified email for testing purposes
      // In production, you'd fetch the user's actual email from Clerk or user database
      const userEmail = "citopuc@gmail.com";

      await EmailService.sendNotificationEmail(
        userEmail,
        notification.title,
        notification.message,
        notification.type,
        "onboarding@resend.dev" // Use verified FROM address
      );

      // eslint-disable-next-line no-console
      console.log(`Email notification sent successfully to ${userEmail}: ${notification.title}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to send email notification: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }

  /**
   * Bulk create notifications
   */
  static async bulkCreate(notifications: CreateNotificationData[]) {
    try {
      const createdNotifications = await Promise.all(
        notifications.map(async (notificationData) => this.create(notificationData)),
      );

      return createdNotifications;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error bulk creating notifications:", error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async cleanupOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          isRead: true,
        },
      });

      return result.count;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error cleaning up old notifications:", error);
      throw error;
    }
  }
}
