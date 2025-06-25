import { NextResponse } from "next/server";

import ScheduledNotificationService from "@/lib/scheduledNotificationService";
import { cleanupTestData, seedTestData } from "@/lib/test-data-seeder";
import TestNotificationService from "@/lib/test-notification-service";

export async function POST(req: Request) {
  try {
    const { type, email } = await req.json();

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    let count: number;
    let message: string;
    let result: any;

    switch (type) {
      case "seed":
        result = await seedTestData();
        return NextResponse.json({
          success: true,
          message: "Test data seeded successfully",
          ...result,
          timestamp: new Date().toISOString(),
        });

      case "cleanup":
        result = await cleanupTestData();
        return NextResponse.json({
          success: true,
          message: "Test data cleaned up successfully",
          timestamp: new Date().toISOString(),
        });

      case "weekly":
        if (email) {
          // Send test email with seed data
          result = await TestNotificationService.createTestWeeklySummary();
          return NextResponse.json({
            success: true,
            message: "Test weekly summary email sent",
            ...result,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Original logic
          count = await ScheduledNotificationService.createWeeklySummary();
          message = "Weekly summary notifications created";
        }
        break;

      case "daily":
        if (email) {
          result = await TestNotificationService.createTestDailyStudyPlan();
          return NextResponse.json({
            success: true,
            message: "Test daily study plan email sent",
            ...result,
            timestamp: new Date().toISOString(),
          });
        } else {
          count = await ScheduledNotificationService.createDailyStudyPlan();
          message = "Daily study plan notifications created";
        }
        break;

      case "tracking":
        if (email) {
          result = await TestNotificationService.createTestTrackingReminder();
          return NextResponse.json({
            success: true,
            message: "Test tracking reminder email sent",
            ...result,
            timestamp: new Date().toISOString(),
          });
        } else {
          count = await ScheduledNotificationService.createDailyTrackingReminder();
          message = "Daily tracking reminder notifications created";
        }
        break;

      default:
        return NextResponse.json(
          {
            error: "Invalid type. Use 'seed', 'cleanup', 'weekly', 'daily', or 'tracking'",
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
    console.error("Error in manual notification test:", error);
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
    message: "Manual notification test endpoint (no auth required)",
    types: {
      seed: "Create test data (courses, assignments, study plans)",
      cleanup: "Remove all test data",
      weekly: "Create weekly summary notifications (add email: true for test email)",
      daily: "Create daily study plan notifications (add email: true for test email)",
      tracking: "Create daily tracking reminder notifications (add email: true for test email)",
    },
    usage: {
      endpoint: "/api/test/manual-notifications",
      method: "POST",
      examples: {
        seed: '{"type": "seed"}',
        email_test: '{"type": "weekly", "email": true}',
        normal_test: '{"type": "weekly"}',
      },
    },
    testEmail: "citopuc@gmail.com",
  });
}
