"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CANVAS_API_URL = "https://cursos.canvas.uc.cl/api/v1";
const CANVAS_TOKEN = process.env.NEXT_PUBLIC_CANVAS_TOKEN!;

export default function CanvasInitializer() {
  const { user } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!user || synced) return;

    const sync = async () => {
      const userId = user.id;

      const { data: existingSemester, error: semesterError } = await supabase
        .from("Semester")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (semesterError) return;

      let semesterId: number;
      if (existingSemester) {
        semesterId = existingSemester.id;
      } else {
        const { data: newSemester, error: insertSemesterError } = await supabase
          .from("Semester")
          .insert({
            user_id: userId,
            Fecha_semestre: format(new Date(), "yyyy-MM-dd"),
          })
          .select()
          .maybeSingle();

        if (insertSemesterError || !newSemester) return;

        semesterId = newSemester.id;
      }

      const coursesRes = await fetch(`${CANVAS_API_URL}/courses?enrollment_state=active`, {
        headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
      });

      if (!coursesRes.ok) return;

      const courses: any[] = await coursesRes.json();

      const formattedCourses = courses.map((c) => ({
        code: c.id.toString(),
        name: c.name || "Sin nombre",
        semester_id: semesterId,
      }));

      const { data: insertedCourses, error: insertCoursesError } = await supabase
        .from("Course")
        .insert(formattedCourses)
        .select();

      if (insertCoursesError) return;

      const now = new Date();
      const startDate = now.toISOString().split("T")[0];
      const endDateObj = new Date();
      endDateObj.setMonth(endDateObj.getMonth() + 3);
      const endDate = endDateObj.toISOString().split("T")[0];

      const contextCodes = courses.map((c) => `course_${c.id}`);
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        type: "assignment",
        per_page: "50",
      });
      contextCodes.forEach((code) => params.append("context_codes[]", code));

      const eventsUrl = `${CANVAS_API_URL}/calendar_events?${params.toString()}`;
      const eventsRes = await fetch(eventsUrl, {
        headers: { Authorization: `Bearer ${CANVAS_TOKEN}` },
      });

      if (!eventsRes.ok) return;

      const events: any[] = await eventsRes.json();

      const activeAssignments = events
        .filter((e) => {
          if (e.type !== "assignment") return false;
          const lockAt = e.assignment?.lock_at ? new Date(e.assignment.lock_at) : null;
          return !lockAt || lockAt > now;
        })
        .map((e) => {
          const courseCanvasId = e.context_code.replace("course_", "");
          const matchingCourse = insertedCourses.find((c) => c.code === courseCanvasId);
          return matchingCourse
            ? {
                nombre_tarea: e.title || "Sin nombre",
                fecha_entrega: e.assignment?.due_at || e.start_at,
                id_curso_pertenencia: matchingCourse.id,
              }
            : null;
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);

      if (activeAssignments.length > 0) {
        await supabase.from("TAREAS").insert(activeAssignments);
      }

      setSynced(true);
    };

    sync();
  }, [user, synced]);

  return null;
}
