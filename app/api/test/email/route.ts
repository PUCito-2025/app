import { auth } from "@clerk/nextjs/server";
import { DeliveryType, NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

// eslint-disable-next-line import/no-named-as-default
import EmailService from "@/lib/emailService";
import { NotificationService } from "@/lib/notificationService";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, testType } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    switch (testType) {
      case "direct":
        // Test direct email sending with Resend
        try {
          await EmailService.sendNotificationEmail(
            email,
            "Test Notification",
            "This is a test email notification sent via Resend.",
            NotificationType.REMINDER,
          );
          return NextResponse.json({
            success: true,
            message: "Direct email sent successfully",
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to send direct email",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          );
        }

      case "welcome":
        // Test welcome email
        try {
          await EmailService.sendWelcomeEmail(email, "Test User");
          return NextResponse.json({
            success: true,
            message: "Welcome email sent successfully",
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to send welcome email",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          );
        }

      case "notification":
        // Test full notification system with email delivery
        try {
          const notification = await NotificationService.create({
            type: NotificationType.REMINDER,
            title: "Email Notification Test",
            message: "This is a test notification that should be delivered via email.",
            userId,
            deliveryType: DeliveryType.EMAIL,
            metadata: {
              source: "email-test",
              testEmail: email,
            },
          });

          return NextResponse.json({
            success: true,
            message: "Email notification created and should be sent",
            notificationId: notification.id,
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: "Failed to create email notification",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          );
        }

      default:
        return NextResponse.json(
          {
            error: "Invalid test type. Use 'direct', 'welcome', or 'notification'",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in email test:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
