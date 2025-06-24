import { NextRequest, NextResponse } from "next/server";

import { NotificationHelpers } from "@/lib/notificationHelpers";
import { NotificationService } from "@/lib/notificationService";

export async function GET(request: NextRequest) {
  try {
    // Verify that this is being called by Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = {
      upcomingReminders: 0,
      overdueNotifications: 0,
      retriedNotifications: 0,
      cleanedNotifications: 0,
    };

    // Create upcoming assignment reminders
    try {
      const upcomingReminders = await NotificationHelpers.createUpcomingAssignmentReminders();
      results.upcomingReminders = upcomingReminders.length;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating upcoming reminders:", error);
    }

    // Create overdue assignment notifications
    try {
      const overdueNotifications = await NotificationHelpers.createOverdueAssignmentNotifications();
      results.overdueNotifications = overdueNotifications.length;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error creating overdue notifications:", error);
    }

    // Retry failed notifications
    try {
      results.retriedNotifications = await NotificationService.processFailedNotifications();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error retrying failed notifications:", error);
    }

    // Cleanup old notifications (only run on Sundays)
    const now = new Date();
    if (now.getDay() === 0) {
      // Sunday
      try {
        results.cleanedNotifications = await NotificationService.cleanupOldNotifications();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error cleaning up old notifications:", error);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in notification cron job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
