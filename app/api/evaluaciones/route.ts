import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!courseId) return NextResponse.json({ error: "Falta 'courseId'" }, { status: 400 });

  const token = process.env.CANVAS_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  // 1️⃣ Verificar inscripción activa
  const enrollRes = await fetch(
    `https://canvas.instructure.com/api/v1/courses/${courseId}/enrollments?user_id=self&state[]=active`,
    { headers }
  );

  if (!enrollRes.ok) {
    const err = await enrollRes.text();
    return NextResponse.json({ error: "Error verificando inscripción", detail: err }, { status: enrollRes.status });
  }

  const enrolls = await enrollRes.json();
  if (!Array.isArray(enrolls) || enrolls.length === 0) {
    return NextResponse.json({ error: "No estás inscrito activamente en este curso" }, { status: 403 });
  }

  // Obtener el rol (por ejemplo, 'StudentEnrollment', 'TeacherEnrollment', etc.)
  const role = enrolls[0]?.type || "desconocido";

  // 2️⃣ Obtener tareas (con opción de incluir pasadas)
  const includePast = request.nextUrl.searchParams.get("includePast") === "true";
  const assignmentURL = `https://canvas.instructure.com/api/v1/courses/${courseId}/assignments`;
  const assignmentRes = await fetch(assignmentURL, { headers });

  if (!assignmentRes.ok) {
    const err = await assignmentRes.text();
    return NextResponse.json({ error: err }, { status: assignmentRes.status });
  }

  const allTasks = await assignmentRes.json();

  // 3️⃣ Filtrado por fecha si no se incluyen pasadas
  const now = new Date();
  const tasks = allTasks.filter((a: any) => {
    if (!a.due_at) return false;
    const due = new Date(a.due_at);
    return includePast ? true : due > now;
  });

  return NextResponse.json({
    role,
    tasks,
    allTasks: includePast ? allTasks : undefined
  });
}
