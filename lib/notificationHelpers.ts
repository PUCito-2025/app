import { addDays } from "date-fns";

import prisma from "@/lib/prisma";

import { CreateNotificationData, NotificationService } from "./notificationService";
import { NotificationTemplates } from "./notificationTemplates";

// Define enums manually since we're having import issues
const NotificationType = {
  STUDY_PLAN: "STUDY_PLAN",
  ASSIGNMENT: "ASSIGNMENT",
  REMINDER: "REMINDER",
  DEADLINE_WARNING: "DEADLINE_WARNING",
  COURSE_UPDATE: "COURSE_UPDATE",
} as const;

interface AssignmentWithCourse {
  id: number;
  title: string;
  dueDate: Date;
  course: {
    name: string;
    semester: {
      userId: number;
    };
  };
}

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

      const reminders = [];

      const reminderPromises = upcomingAssignments.map(async (assignment: AssignmentWithCourse) => {
        // Check if reminder already exists
        const existingReminder = await prisma.notification.findFirst({
          where: {
            assignmentId: assignment.id,
            type: NotificationType.DEADLINE_WARNING,
            userId: assignment.course.semester.userId.toString(),
          },
        });

        if (!existingReminder) {
          const daysDifference = Math.ceil(
            (assignment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
          );

          return this.createAssignmentDeadlineReminder(
            assignment.id,
            assignment.course.semester.userId.toString(),
            daysDifference,
          );
        }
        return null;
      });

      const results = await Promise.all(reminderPromises);
      reminders.push(...results.filter(Boolean));

      return reminders;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating assignment reminders:", error);
      throw error;
    }
  }

  /**
   * Create overdue assignment notifications
   */
  static async createOverdueAssignmentNotifications() {
    try {
      const now = new Date();

      // Find assignments that are overdue
      const overdueAssignments = await prisma.assignment.findMany({
        where: {
          dueDate: {
            lt: now,
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

      const notifications = [];

      const notificationPromises = overdueAssignments.map(async (assignment: AssignmentWithCourse) => {
        // Check if overdue notification already exists
        const existingNotification = await prisma.notification.findFirst({
          where: {
            assignmentId: assignment.id,
            type: NotificationType.ASSIGNMENT,
            userId: assignment.course.semester.userId.toString(),
            title: {
              contains: "Overdue",
            },
          },
        });

        if (!existingNotification) {
          return NotificationService.create({
            type: NotificationType.ASSIGNMENT,
            title: NotificationTemplates.ASSIGNMENT_OVERDUE.title(assignment.title),
            message: NotificationTemplates.ASSIGNMENT_OVERDUE.message(assignment.title, assignment.course.name),
            userId: assignment.course.semester.userId.toString(),
            assignmentId: assignment.id,
            metadata: {
              assignmentTitle: assignment.title,
              courseName: assignment.course.name,
              dueDate: assignment.dueDate,
              overdue: true,
            },
          });
        }
        return null;
      });

      const results = await Promise.all(notificationPromises);
      notifications.push(...results.filter(Boolean));

      return notifications;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating overdue assignment notifications:", error);
      throw error;
    }
  }
}
