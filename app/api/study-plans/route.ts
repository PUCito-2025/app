import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");

    // Ensure user can only access their own study plans
    if (requestedUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studyPlans = await prisma.studyPlan.findMany({
      where: {
        userId,
      },
      orderBy: {
        planDate: "desc",
      },
    });

    return NextResponse.json({ studyPlans });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch study plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, planDate, studiedHours } = body;

    // Validate input
    if (!courseId || !planDate || studiedHours === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if a study plan already exists for this date and course
    const existingPlan = await prisma.studyPlan.findFirst({
      where: {
        courseId: parseInt(courseId, 10),
        userId,
        planDate: new Date(planDate),
      },
    });

    let studyPlan;

    if (existingPlan) {
      // Update existing plan by adding hours
      studyPlan = await prisma.studyPlan.update({
        where: { id: existingPlan.id },
        data: {
          studiedHours: existingPlan.studiedHours + parseInt(studiedHours, 10),
        },
      });
    } else {
      // Create new plan
      studyPlan = await prisma.studyPlan.create({
        data: {
          courseId: parseInt(courseId, 10),
          userId,
          planDate: new Date(planDate),
          studiedHours: parseInt(studiedHours, 10),
          recommendedHours: 0, // Default to 0, can be updated later
        },
      });
    }

    return NextResponse.json({ studyPlan });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save study plan" }, { status: 500 });
  }
}
