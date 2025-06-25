import { NextResponse } from "next/server";

// eslint-disable-next-line import/no-named-as-default
import ScheduledNotificationService from "@/lib/scheduledNotificationService";

export async function POST(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if it's Monday in Chilean timezone
    const now = new Date();
    const chileanTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Santiago" }));
    const dayOfWeek = chileanTime.getDay(); // 0 = Sunday, 1 = Monday

    if (dayOfWeek !== 1) {
      return NextResponse.json({
        message: "Not Monday in Chilean timezone, skipping weekly summary",
        day: dayOfWeek,
        time: chileanTime.toISOString(),
      });
    }

    // Create weekly summary notifications
    const count = await ScheduledNotificationService.createWeeklySummary();

    return NextResponse.json({
      success: true,
      message: "Weekly summary notifications created",
      count,
      time: chileanTime.toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in weekly summary cron job:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "Weekly summary cron endpoint",
    schedule: "Mondays at 8 AM Chilean time",
    timezone: "America/Santiago",
  });
}
