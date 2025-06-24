import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { NotificationService } from "@/lib/notificationService";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadCount = await NotificationService.getUnreadCount(userId);

    return NextResponse.json({ unreadCount });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error getting unread count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
