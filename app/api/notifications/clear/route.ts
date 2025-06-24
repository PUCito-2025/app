import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { NotificationService } from "@/lib/notificationService";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // NOTE: Using hardcoded test user ID for now
    // Mark all notifications as read
    await NotificationService.markAllAsRead("test-user-ignacio");

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
