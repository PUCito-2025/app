import { NotificationType } from "@prisma/client";

import EmailService from "@/lib/emailService";
import prisma from "@/lib/prisma";

const TEST_EMAIL = "citopuc@gmail.com";

export class TestNotificationService {
  /**
   * Create test weekly summary notification
   */
  static async createTestWeeklySummary() {
    try {
      // Get test user data
      const summaryData = await this.getTestWeeklySummaryData();

      // Send email directly to test address (skip database notification)
      await EmailService.sendNotificationEmail(
        TEST_EMAIL,
        "📅 Resumen Semanal - Lunes (TEST)",
        summaryData.message,
        NotificationType.REMINDER,
        "onboarding@resend.dev", // Use verified Resend domain
      );

      console.log(`✅ Test weekly summary sent to ${TEST_EMAIL}`);
      return {
        success: true,
        email: TEST_EMAIL,
        assignmentsCount: summaryData.assignmentsCount,
        studyPlansCount: summaryData.studyPlansCount
      };
    } catch (error) {
      console.error("❌ Error creating test weekly summary:", error);
      throw error;
    }
  }

  /**
   * Create test daily study plan notification
   */
  static async createTestDailyStudyPlan() {
    try {
      const today = new Date();
      const dailyData = await this.getTestDailyStudyPlanData(today);

      if (!dailyData.hasPlans) {
        return { success: false, message: "No study plans for today" };
      }

      // Send email directly to test address (skip database notification)
      await EmailService.sendNotificationEmail(
        TEST_EMAIL,
        "📚 Plan de Estudio Diario (TEST)",
        dailyData.message,
        NotificationType.STUDY_PLAN,
        "onboarding@resend.dev", // Use verified Resend domain
      );

      console.log(`✅ Test daily study plan sent to ${TEST_EMAIL}`);
      return {
        success: true,
        email: TEST_EMAIL,
        plansCount: dailyData.plansCount,
        totalHours: dailyData.totalHours
      };
    } catch (error) {
      console.error("❌ Error creating test daily study plan:", error);
      throw error;
    }
  }

  /**
   * Create test tracking reminder notification
   */
  static async createTestTrackingReminder() {
    try {
      const today = new Date();
      const trackingData = await this.getTestTrackingReminderData(today);

      // Send email directly to test address (skip database notification)
      await EmailService.sendNotificationEmail(
        TEST_EMAIL,
        "⏱️ Recordatorio de Seguimiento (TEST)",
        trackingData.message,
        NotificationType.REMINDER,
        "onboarding@resend.dev", // Use verified Resend domain
      );

      console.log(`✅ Test tracking reminder sent to ${TEST_EMAIL}`);
      return {
        success: true,
        email: TEST_EMAIL,
        remainingHours: trackingData.remainingHours,
        studiedHours: trackingData.studiedHours
      };
    } catch (error) {
      console.error("❌ Error creating test tracking reminder:", error);
      throw error;
    }
  }

  /**
   * Get test weekly summary data
   */
  private static async getTestWeeklySummaryData() {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Get upcoming assignments
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: nextWeek,
        },
        course: {
          name: {
            contains: "Test Course",
          },
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
        userId: "test-user-ignacio",
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

    let message = "¡Buenos días Ignacio! 🌅\n\n";
    message += "**Esta es una prueba del sistema de notificaciones.**\n\n";
    message += "Aquí tienes tu resumen semanal:\n\n";

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

    message += "¡Que tengas una excelente semana de estudios! 💪\n\n";
    message += "Recuerda registrar tus horas de estudio en el sistema para hacer seguimiento de tu progreso.\n\n";
    message += "---\n";
    message += "**NOTA**: Este es un email de prueba del sistema de notificaciones programadas.";

    return {
      message,
      assignmentsCount: upcomingAssignments.length,
      studyPlansCount: weeklyStudyPlans.length,
    };
  }

  /**
   * Get test daily study plan data
   */
  private static async getTestDailyStudyPlanData(date: Date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyPlans = await prisma.studyPlan.findMany({
      where: {
        userId: "test-user-ignacio",
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

    let message = `¡Buenos días Ignacio! 🌅\n\n`;
    message += "**Esta es una prueba del sistema de notificaciones.**\n\n";
    message += `Tu plan de estudio para ${dayName}:\n\n`;
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
    message += "¡Mucho éxito en tus estudios hoy! 🎯\n\n";
    message += "---\n";
    message += "**NOTA**: Este es un email de prueba del sistema de notificaciones programadas.";

    return {
      message,
      hasPlans: true,
      plansCount: dailyPlans.length,
      totalHours,
    };
  }

  /**
   * Get test tracking reminder data
   */
  private static async getTestTrackingReminderData(date: Date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todayPlans = await prisma.studyPlan.findMany({
      where: {
        userId: "test-user-ignacio",
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

    let message = "¡Hora de actualizar tu progreso, Ignacio! ⏰\n\n";
    message += "**Esta es una prueba del sistema de notificaciones.**\n\n";

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
    message += "¡Sigue así! 💪\n\n";
    message += "---\n";
    message += "**NOTA**: Este es un email de prueba del sistema de notificaciones programadas.";

    return {
      message,
      remainingHours,
      studiedHours: totalStudiedHours,
      plannedHours: totalPlannedHours,
    };
  }
}

export default TestNotificationService;
