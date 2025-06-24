import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { NotificationService } from "@/lib/notificationService";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const notificationId = parseInt(params.id, 10);

    if (Number.isNaN(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    const notification = await NotificationService.markAsRead(notificationId, userId);

    return NextResponse.json({ notification });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
