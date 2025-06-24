import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTestData() {
  try {
    // Clean up existing test data
    await prisma.notification.deleteMany({
      where: {
        userId: "test-user-ignacio",
      },
    });

    await prisma.studyPlan.deleteMany({
      where: {
        userId: "test-user-ignacio",
      },
    });

    await prisma.assignment.deleteMany({
      where: {
        course: {
          name: {
            contains: "Test Course",
          },
        },
      },
    });

    await prisma.course.deleteMany({
      where: {
        name: {
          contains: "Test Course",
        },
      },
    });

    await prisma.semester.deleteMany({
      where: {
        userId: 999999,
      },
    });

    // Create test semester
    const testSemester = await prisma.semester.create({
      data: {
        semesterDate: new Date(),
        userId: 999999,
      },
    });

    // Create test courses
    const mathCourse = await prisma.course.create({
      data: {
        code: "MAT101",
        name: "Test Course - Matemáticas",
        semesterId: testSemester.id,
      },
    });

    const physicsCourse = await prisma.course.create({
      data: {
        code: "FIS101",
        name: "Test Course - Física",
        semesterId: testSemester.id,
      },
    });

    const chemistryCourse = await prisma.course.create({
      data: {
        code: "QUI101",
        name: "Test Course - Química",
        semesterId: testSemester.id,
      },
    });

    // Create upcoming assignments (for weekly summary)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    await prisma.assignment.createMany({
      data: [
        {
          title: "Tarea de Cálculo Integral",
          dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // In 2 days
          courseId: mathCourse.id,
        },
        {
          title: "Laboratorio de Mecánica",
          dueDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // In 4 days
          courseId: physicsCourse.id,
        },
        {
          title: "Examen de Reacciones Químicas",
          dueDate: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000), // In 6 days
          courseId: chemistryCourse.id,
        },
      ],
    });

    // Create study plans for this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const studyPlans = [];

    // Create study plans for the current week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      if (i < 3) {
        // Math study plans (Mon, Tue, Wed)
        studyPlans.push({
          studiedHours: i === 0 ? 2 : i === 1 ? 1 : 0, // Some studied hours
          recommendedHours: 3,
          planDate: date,
          userId: "test-user-ignacio",
          courseId: mathCourse.id,
        });
      }

      if (i >= 1 && i < 4) {
        // Physics study plans (Tue, Wed, Thu)
        studyPlans.push({
          studiedHours: i === 1 ? 1 : 0,
          recommendedHours: 2,
          planDate: date,
          userId: "test-user-ignacio",
          courseId: physicsCourse.id,
        });
      }

      if (i >= 3 && i < 6) {
        // Chemistry study plans (Thu, Fri, Sat)
        studyPlans.push({
          studiedHours: 0,
          recommendedHours: 2,
          planDate: date,
          userId: "test-user-ignacio",
          courseId: chemistryCourse.id,
        });
      }
    }

    // Create today's study plans specifically
    const todayPlans = [
      {
        studiedHours: 1,
        recommendedHours: 3,
        planDate: today,
        userId: "test-user-ignacio",
        courseId: mathCourse.id,
      },
      {
        studiedHours: 0,
        recommendedHours: 2,
        planDate: today,
        userId: "test-user-ignacio",
        courseId: physicsCourse.id,
      },
    ];

    await prisma.studyPlan.createMany({
      data: [...studyPlans, ...todayPlans],
    });

    console.log("✅ Test data seeded successfully!");
    console.log(`📚 Created ${studyPlans.length + todayPlans.length} study plans`);
    console.log("📝 Created 3 upcoming assignments");
    console.log("🎓 Created 3 test courses");
    console.log("📧 Ready to send test emails to ignaengelberger@gmail.com");

    return {
      success: true,
      studyPlansCount: studyPlans.length + todayPlans.length,
      assignmentsCount: 3,
      coursesCount: 3,
    };
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function cleanupTestData() {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId: "test-user-ignacio",
      },
    });

    await prisma.studyPlan.deleteMany({
      where: {
        userId: "test-user-ignacio",
      },
    });

    await prisma.assignment.deleteMany({
      where: {
        course: {
          name: {
            contains: "Test Course",
          },
        },
      },
    });

    await prisma.course.deleteMany({
      where: {
        name: {
          contains: "Test Course",
        },
      },
    });

    await prisma.semester.deleteMany({
      where: {
        userId: 999999,
      },
    });

    console.log("✅ Test data cleaned up successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
