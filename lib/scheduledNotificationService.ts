import { DeliveryType, NotificationType } from "@prisma/client";

import { NotificationService } from "@/lib/notificationService";
import prisma from "@/lib/prisma";

export interface ScheduledNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  deliveryType?: DeliveryType;
  metadata?: Record<string, unknown>;
}

export class ScheduledNotificationService {
  /**
   * Create weekly summary notification (Mondays at 8 AM)
   * Summary of upcoming assignments and study plans
   */
  static async createWeeklySummary() {
    try {
      // Get all users who have study plans or assignments
      const users = await this.getActiveUsers();

      const notifications = await Promise.all(
        users.map(async (userId) => {
          const summaryData = await this.getWeeklySummaryData(userId);

          if (summaryData.hasContent) {
            return NotificationService.create({
              type: NotificationType.REMINDER,
              title: "📅 Resumen Semanal - Lunes",
              message: summaryData.message,
              userId,
              deliveryType: DeliveryType.EMAIL,
              metadata: {
                source: "weekly_summary",
                schedule: "monday_8am",
                assignmentsCount: summaryData.assignmentsCount,
                studyPlansCount: summaryData.studyPlansCount,
              },
            });
          }
          return null;
        }),
      );

      const createdCount = notifications.filter(Boolean).length;
      // eslint-disable-next-line no-console
      console.log(`Created weekly summary notifications for ${createdCount} users`);
      return createdCount;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating weekly summary notifications:", error);
      throw error;
    }
  }

  /**
   * Create daily study plan notification (Tuesday-Sunday at 8 AM)
   * Summary of today's study plans
   */
  static async createDailyStudyPlan() {
    try {
      const users = await this.getActiveUsers();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const notifications = await Promise.all(
        users.map(async (userId) => {
          const dailyData = await this.getDailyStudyPlanData(userId, today);

          if (dailyData.hasPlans) {
            return NotificationService.create({
              type: NotificationType.STUDY_PLAN,
              title: "📚 Plan de Estudio Diario",
              message: dailyData.message,
              userId,
              deliveryType: DeliveryType.EMAIL,
              metadata: {
                source: "daily_study_plan",
                schedule: "daily_8am",
                date: today.toISOString(),
                plansCount: dailyData.plansCount,
                totalHours: dailyData.totalHours,
              },
            });
          }
          return null;
        }),
      );

      const createdCount = notifications.filter(Boolean).length;
      // eslint-disable-next-line no-console
      console.log(`Created daily study plan notifications for ${createdCount} users`);
      return createdCount;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating daily study plan notifications:", error);
      throw error;
    }
  }

  /**
   * Create daily tracking reminder notification (Daily at 2 PM)
   * Reminder to upload studied times with remaining hours for the day
   */
  static async createDailyTrackingReminder() {
    try {
      const users = await this.getActiveUsers();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const notifications = await Promise.all(
        users.map(async (userId) => {
          const trackingData = await this.getTrackingReminderData(userId, today);

          return NotificationService.create({
            type: NotificationType.REMINDER,
            title: "⏱️ Recordatorio de Seguimiento",
            message: trackingData.message,
            userId,
            deliveryType: DeliveryType.EMAIL,
            metadata: {
              source: "daily_tracking_reminder",
              schedule: "daily_2pm",
              date: today.toISOString(),
              remainingHours: trackingData.remainingHours,
              studiedHours: trackingData.studiedHours,
            },
          });
        }),
      );

      // eslint-disable-next-line no-console
      console.log(`Created tracking reminder notifications for ${notifications.length} users`);
      return notifications.length;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating tracking reminder notifications:", error);
      throw error;
    }
  }

  /**
   * Get all users who have active study plans or assignments
   */
  private static async getActiveUsers(): Promise<string[]> {
    // Get users with study plans in the last 30 days or upcoming assignments
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const studyPlanUsers = await prisma.studyPlan.findMany({
      where: {
        planDate: {
          gte: cutoffDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    // For now, we'll use study plan users as they have userId
    // In the future, you might want to add a User model to link assignments to users
    const userIds = new Set(studyPlanUsers.map((sp) => sp.userId));

    return Array.from(userIds);
  }

  /**
   * Get weekly summary data for a user
   */
  private static async getWeeklySummaryData(userId: string) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Get upcoming assignments (within next week)
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: nextWeek,
        },
      },
      include: {
        course: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Get study plans for this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59, 999);

    const weeklyStudyPlans = await prisma.studyPlan.findMany({
      where: {
        userId,
        planDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        course: true,
      },
      orderBy: {
        planDate: "asc",
      },
    });

    let message = "¡Buenos días! 🌅\n\nAquí tienes tu resumen semanal:\n\n";

    if (upcomingAssignments.length > 0) {
      message += "📋 **Tareas próximas esta semana:**\n";
      upcomingAssignments.forEach((assignment) => {
        const dueDate = new Date(assignment.dueDate);
        const formattedDate = dueDate.toLocaleDateString("es-CL", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
        message += `• ${assignment.title} (${assignment.course.name}) - ${formattedDate}\n`;
      });
      message += "\n";
    }

    if (weeklyStudyPlans.length > 0) {
      message += "📚 **Planes de estudio esta semana:**\n";
      const totalRecommendedHours = weeklyStudyPlans.reduce((sum, plan) => sum + plan.recommendedHours, 0);
      message += `• ${weeklyStudyPlans.length} sesiones planificadas\n`;
      message += `• Total de horas recomendadas: ${totalRecommendedHours}h\n\n`;

      // Group by day
      const plansByDay = weeklyStudyPlans.reduce(
        (acc, plan) => {
          const day = new Date(plan.planDate).toLocaleDateString("es-CL", {
            weekday: "long",
          });
          if (!acc[day]) acc[day] = [];
          acc[day].push(plan);
          return acc;
        },
        {} as Record<string, typeof weeklyStudyPlans>,
      );

      Object.entries(plansByDay).forEach(([day, plans]) => {
        message += `**${day.charAt(0).toUpperCase() + day.slice(1)}:**\n`;
        plans.forEach((plan) => {
          message += `  • ${plan.course.name} - ${plan.recommendedHours}h\n`;
        });
        message += "\n";
      });
    }

    if (upcomingAssignments.length === 0 && weeklyStudyPlans.length === 0) {
      message +=
        "No tienes tareas pendientes ni planes de estudio programados para esta semana. " +
        "¡Perfecto momento para organizarte! 🎯\n\n";
    }

    message += "¡Que tengas una excelente semana de estudios! 💪\n\n";
    message += "Recuerda registrar tus horas de estudio en el sistema para hacer seguimiento de tu progreso.";

    return {
      message,
      hasContent: upcomingAssignments.length > 0 || weeklyStudyPlans.length > 0,
      assignmentsCount: upcomingAssignments.length,
      studyPlansCount: weeklyStudyPlans.length,
    };
  }

  /**
   * Get daily study plan data for a user
   */
  private static async getDailyStudyPlanData(userId: string, date: Date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyPlans = await prisma.studyPlan.findMany({
      where: {
        userId,
        planDate: {
          gte: date,
          lte: endOfDay,
        },
      },
      include: {
        course: true,
      },
      orderBy: {
        planDate: "asc",
      },
    });

    if (dailyPlans.length === 0) {
      return {
        message: "",
        hasPlans: false,
        plansCount: 0,
        totalHours: 0,
      };
    }

    const totalHours = dailyPlans.reduce((sum, plan) => sum + plan.recommendedHours, 0);
    const dayName = date.toLocaleDateString("es-CL", { weekday: "long" });

    let message = `¡Buenos días! 🌅\n\nTu plan de estudio para ${dayName}:\n\n`;
    message += `📚 **${dailyPlans.length} sesiones planificadas (${totalHours}h total):**\n\n`;

    dailyPlans.forEach((plan, index) => {
      message += `${index + 1}. **${plan.course.name}**\n`;
      const hourText = plan.recommendedHours > 1 ? "horas" : "hora";
      const recommendedText = plan.recommendedHours > 1 ? "recomendadas" : "recomendada";
      message += `   ⏱️ ${plan.recommendedHours} ${hourText} ${recommendedText}\n`;
      if (plan.studiedHours > 0) {
        message += `   ✅ Ya estudiaste: ${plan.studiedHours}h\n`;
      }
      message += "\n";
    });

    message += "💡 **Consejos para hoy:**\n";
    message += "• Divide tu tiempo de estudio en bloques de 25-50 minutos\n";
    message += "• Toma descansos de 5-10 minutos entre bloques\n";
    message += "• Recuerda registrar tus horas estudiadas a las 2 PM\n\n";
    message += "¡Mucho éxito en tus estudios hoy! 🎯";

    return {
      message,
      hasPlans: true,
      plansCount: dailyPlans.length,
      totalHours,
    };
  }

  /**
   * Get tracking reminder data for a user
   */
  private static async getTrackingReminderData(userId: string, date: Date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todayPlans = await prisma.studyPlan.findMany({
      where: {
        userId,
        planDate: {
          gte: date,
          lte: endOfDay,
        },
      },
      include: {
        course: true,
      },
    });

    const totalPlannedHours = todayPlans.reduce((sum, plan) => sum + plan.recommendedHours, 0);
    const totalStudiedHours = todayPlans.reduce((sum, plan) => sum + plan.studiedHours, 0);
    const remainingHours = Math.max(0, totalPlannedHours - totalStudiedHours);

    let message = "¡Hora de actualizar tu progreso! ⏰\n\n";

    if (todayPlans.length > 0) {
      message += `📊 **Resumen de tu día:**\n`;
      message += `• Horas planificadas: ${totalPlannedHours}h\n`;
      message += `• Horas registradas: ${totalStudiedHours}h\n`;
      message += `• Horas restantes: ${remainingHours}h\n\n`;

      if (remainingHours > 0) {
        message += `🎯 **¡Aún puedes aprovechar ${remainingHours} hora${remainingHours > 1 ? "s" : ""} más hoy!**\n\n`;
        message += "Cursos pendientes:\n";
        todayPlans.forEach((plan) => {
          const pending = plan.recommendedHours - plan.studiedHours;
          if (pending > 0) {
            message += `• ${plan.course.name}: ${pending}h restante${pending > 1 ? "s" : ""}\n`;
          }
        });
        message += "\n";
      } else if (totalStudiedHours >= totalPlannedHours) {
        message += "🎉 **¡Felicitaciones! Ya cumpliste tu meta de estudio del día**\n\n";
        message += "¿Estudiaste tiempo adicional? No olvides registrarlo también.\n\n";
      }
    } else {
      message += "No tienes planes de estudio programados para hoy.\n\n";
      message += "Si estudiaste algo, ¡no olvides registrarlo en el sistema!\n\n";
    }

    message += "📱 **¿Cómo registrar tu tiempo?**\n";
    message += "1. Ve a la sección de Seguimiento\n";
    message += "2. Actualiza las horas estudiadas para cada materia\n";
    message += "3. ¡Eso es todo!\n\n";
    message += "Registrar tu progreso te ayuda a:\n";
    message += "✓ Mantener un historial de tu dedicación\n";
    message += "✓ Identificar patrones de estudio\n";
    message += "✓ Alcanzar tus metas académicas\n\n";
    message += "¡Sigue así! 💪";

    return {
      message,
      remainingHours,
      studiedHours: totalStudiedHours,
      plannedHours: totalPlannedHours,
    };
  }
}

export default ScheduledNotificationService;
