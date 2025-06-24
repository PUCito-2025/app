import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { NotificationService } from "@/lib/notificationService";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark all notifications as read
    await NotificationService.markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      message: "All notifications cleared"
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
