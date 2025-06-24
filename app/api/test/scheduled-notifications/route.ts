import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// eslint-disable-next-line import/no-named-as-default
import ScheduledNotificationService from "@/lib/scheduledNotificationService";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json();

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    let count: number;
    let message: string;

    switch (type) {
      case "weekly":
        count = await ScheduledNotificationService.createWeeklySummary();
        message = "Weekly summary notifications created";
        break;

      case "daily":
        count = await ScheduledNotificationService.createDailyStudyPlan();
        message = "Daily study plan notifications created";
        break;

      case "tracking":
        count = await ScheduledNotificationService.createDailyTrackingReminder();
        message = "Daily tracking reminder notifications created";
        break;

      default:
        return NextResponse.json(
          {
            error: "Invalid type. Use 'weekly', 'daily', or 'tracking'",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      message,
      count,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in scheduled notification test:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Scheduled notifications test endpoint",
    types: {
      weekly: "Create weekly summary notifications (Monday 8 AM)",
      daily: "Create daily study plan notifications (Tuesday-Sunday 8 AM)",
      tracking: "Create daily tracking reminder notifications (Daily 2 PM)",
    },
    usage: {
      endpoint: "/api/test/scheduled-notifications",
      method: "POST",
      body: '{"type": "weekly|daily|tracking"}',
    },
  });
}
