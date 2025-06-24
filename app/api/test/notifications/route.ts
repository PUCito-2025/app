import { auth } from "@clerk/nextjs/server";
import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

import { NotificationService } from "@/lib/notificationService";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create sample notifications to test the system
    const notifications = [];

    // Create a general notification
    const generalNotification = await NotificationService.create({
      type: NotificationType.REMINDER,
      title: "Welcome to the notification system!",
      message: "Your notification system is now set up and working correctly.",
      userId,
      metadata: {
        source: "test",
      },
    });
    notifications.push(generalNotification);

    // Create a reminder notification
    const reminderNotification = await NotificationService.create({
      type: NotificationType.ASSIGNMENT,
      title: "Don't forget to check your assignments",
      message: "You have assignments that may be due soon. Check your calendar!",
      userId,
      metadata: {
        source: "test",
      },
    });
    notifications.push(reminderNotification);

    return NextResponse.json({
      success: true,
      message: "Sample notifications created",
      notifications: notifications.length,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating test notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
