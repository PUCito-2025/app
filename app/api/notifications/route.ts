/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@clerk/nextjs/server";
import { NotificationType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { NotificationService } from "@/lib/notificationService";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const isRead = searchParams.get("isRead");
    const typeParam = searchParams.get("type");

    // NOTE: Ojo que esto está hardcodeado ya que por ahora solo podemos enviar correos fake por resend
    const filters: any = {
      userId: "test-user-ignacio",
      limit,
      offset,
      ...(isRead !== null && { isRead: isRead === "true" }),
    };

    // Only add type filter if it's a valid enum value
    if (typeParam && Object.values(NotificationType).includes(typeParam as any)) {
      filters.type = typeParam;
    }

    const notifications = await NotificationService.getNotifications(filters);

    return NextResponse.json({ notifications });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, assignmentId, studyPlanId, deliveryType, metadata } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields: type, title, message" }, { status: 400 });
    }

    const notification = await NotificationService.create({
      type,
      title,
      message,
      userId,
      assignmentId,
      studyPlanId,
      deliveryType,
      metadata,
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
