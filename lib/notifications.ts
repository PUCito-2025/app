/* eslint-disable no-console */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeliveryType, NotificationStatus, NotificationType, PrismaClient } from "@prisma/client";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

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
          deliveryType: data.deliveryType || DeliveryType.IN_APP,
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
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Get notifications for a user with filters
   */
  static async getNotifications(filters: NotificationFilters) {
    try {
      const where: any = {};

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
        orderBy: [{ createdAt: "desc" }],
        take: filters.limit || 50,
        skip: filters.offset || 0,
      });

      return notifications;
    } catch (error) {
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
            throw new Error(`Unsupported delivery type: ${notification.deliveryType}`);
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
          console.log(`Notification ${notificationId} failed, will retry via cron job`);
        }

        throw sendError;
      }
    } catch (error) {
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

      const responses = await Promise.all(
        failedNotifications.map(async (notification) => {
          try {
            await this.sendNotification(notification.id);
          } catch (error) {
            console.error(`Failed to retry notification ${notification.id}:`, error);
          }
        }),
      );
      return responses.length;
    } catch (error) {
      console.error("Error processing failed notifications:", error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(notification: any) {
    // TODO: Implement email sending with nodemailer
    console.log(`Sending email notification: ${notification.title}`);

    // Example implementation:
    // const transporter = nodemailer.createTransporter({...});
    // await transporter.sendMail({
    //   to: userEmail,
    //   subject: notification.title,
    //   html: notification.message,
    // });
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
      console.error("Error bulk creating notifications:", error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  static async cleanupOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = addDays(new Date(), -daysOld);

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
      console.error("Error cleaning up old notifications:", error);
      throw error;
    }
  }
}

// Notification templates (in code, not DB)
export const NotificationTemplates = {
  ASSIGNMENT_DUE_SOON: {
    title: (assignmentTitle: string) => `Assignment Due Soon: ${assignmentTitle}`,
    message: (assignmentTitle: string, courseName: string, days: number) =>
      `Your assignment "${assignmentTitle}" for ${courseName} is due in ${days} day(s).`,
  },
  ASSIGNMENT_OVERDUE: {
    title: (assignmentTitle: string) => `Overdue Assignment: ${assignmentTitle}`,
    message: (assignmentTitle: string, courseName: string) =>
      `Your assignment "${assignmentTitle}" for ${courseName} is overdue.`,
  },
  STUDY_PLAN_REMINDER: {
    title: (courseName: string) => `Study Session Reminder: ${courseName}`,
    message: (courseName: string, hours: number) =>
      `Your scheduled study session for ${courseName} starts in ${hours} hours.`,
  },
  COURSE_UPDATE: {
    title: (courseName: string) => `Course Update: ${courseName}`,
    message: (courseName: string, updateMessage: string) => `${courseName}: ${updateMessage}`,
  },
};

// Business logic helpers for common notification scenarios
export class NotificationHelpers {
  /**
   * Create assignment deadline reminder
   */
  static async createAssignmentDeadlineReminder(assignmentId: number, userId: string, reminderDays: number = 1) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    return NotificationService.create({
      type: NotificationType.DEADLINE_WARNING,
      title: NotificationTemplates.ASSIGNMENT_DUE_SOON.title(assignment.title),
      message: NotificationTemplates.ASSIGNMENT_DUE_SOON.message(
        assignment.title,
        assignment.course.name,
        reminderDays,
      ),
      userId,
      assignmentId,
      metadata: {
        assignmentTitle: assignment.title,
        courseName: assignment.course.name,
        dueDate: assignment.dueDate,
        reminderDays,
      },
    });
  }

  /**
   * Create study plan reminder
   */
  static async createStudyPlanReminder(studyPlanId: number, userId: string, reminderHours: number = 2) {
    const studyPlan = await prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: { course: true },
    });

    if (!studyPlan) {
      throw new Error("Study plan not found");
    }

    return NotificationService.create({
      type: NotificationType.STUDY_PLAN,
      title: NotificationTemplates.STUDY_PLAN_REMINDER.title(studyPlan.course.name),
      message: NotificationTemplates.STUDY_PLAN_REMINDER.message(studyPlan.course.name, reminderHours),
      userId,
      studyPlanId,
      metadata: {
        courseName: studyPlan.course.name,
        studyDate: studyPlan.planDate,
        recommendedHours: studyPlan.recommendedHours,
        reminderHours,
      },
    });
  }

  /**
   * Create course update notification
   */
  static async createCourseUpdateNotification(courseId: number, userIds: string[], updateMessage: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    const notifications: CreateNotificationData[] = userIds.map((userId) => ({
      type: NotificationType.COURSE_UPDATE,
      title: NotificationTemplates.COURSE_UPDATE.title(course.name),
      message: NotificationTemplates.COURSE_UPDATE.message(course.name, updateMessage),
      userId,
      metadata: {
        courseId,
        courseName: course.name,
        updateMessage,
      },
    }));

    return NotificationService.bulkCreate(notifications);
  }

  /**
   * Check for assignments due soon and create reminders
   */
  static async createUpcomingAssignmentReminders() {
    try {
      const tomorrow = addDays(new Date(), 1);
      const nextWeek = addDays(new Date(), 7);

      // Find assignments due in 1 day and 7 days
      const upcomingAssignments = await prisma.assignment.findMany({
        where: {
          dueDate: {
            gte: tomorrow,
            lte: nextWeek,
          },
        },
        include: {
          course: {
            include: {
              semester: true,
            },
          },
        },
      });

      const reminders = await Promise.all(
        upcomingAssignments.map(async (assignment) => {
          // Check if reminder already exists
          const existingReminder = await prisma.notification.findFirst({
            where: {
              assignmentId: assignment.id,
              type: NotificationType.DEADLINE_WARNING,
              userId: assignment.course.semester.userId.toString(),
            },
          });
          if (existingReminder) {
            return null; // Skip if reminder already exists
          }
          const daysDifference = Math.ceil(
            (assignment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
          );
          return this.createAssignmentDeadlineReminder(
            assignment.id,
            assignment.course.semester.userId.toString(),
            daysDifference,
          );
        }),
      );

      return reminders;
    } catch (error) {
      console.error("Error creating assignment reminders:", error);
      throw error;
    }
  }
}
