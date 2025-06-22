import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs";

const prisma = new PrismaClient();

export async function GET() {
  const { userId } = auth(); // Clerk userId is a string

  if (!userId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  try {
    const studyPlans = await prisma.studyPlan.findMany({
      where: { userId },
      include: {
        course: true, // to include course name/code
      },
    });

    return new Response(JSON.stringify(studyPlans), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }
}
