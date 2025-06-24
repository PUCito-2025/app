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

    // Get Chilean time
    const now = new Date();
    const chileanTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Santiago" }));

    // Create daily tracking reminder notifications
    const count = await ScheduledNotificationService.createDailyTrackingReminder();

    return NextResponse.json({
      success: true,
      message: "Daily tracking reminder notifications created",
      count,
      time: chileanTime.toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in tracking reminder cron job:", error);
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
    message: "Daily tracking reminder cron endpoint",
    schedule: "Daily at 2 PM Chilean time",
    timezone: "America/Santiago",
  });
}
