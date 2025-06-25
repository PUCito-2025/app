import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { NotificationService } from "@/lib/notificationService";

export async function PUT() {
  try {
    const { userId } = await auth();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await NotificationService.markAllAsRead("test-user-ignacio");

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
