'use client';
import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { useEffect, useState } from "react";

export default function CanvasInitializer() {
  const { user } = useUser();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!user || synced) return;

    const sync = async () => {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            fetch: (url, options = {}) => {
              const cleanOptions: RequestInit = { ...options };
              const headers = new Headers(cleanOptions.headers);
              headers.set("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
              headers.set("Accept", "application/json");
              headers.delete("Authorization");
              cleanOptions.headers = headers;
              return fetch(url, cleanOptions);
            },
          },
        }
      );

      const userId = user.id;

      const { data: existingSemester } = await supabase
        .from("Semester")
        .select("*")
        .eq("userId", userId)
        .maybeSingle();

      let semesterId: number;
      if (existingSemester) {
        semesterId = existingSemester.id;
      } else {
        const { data: newSemester } = await supabase
          .from("Semester")
          .insert({
            userId,
            semesterDate: format(new Date(), "yyyy-MM-dd"),
          })
          .select()
          .maybeSingle();

        if (!newSemester) return;
        semesterId = newSemester.id;
      }

      const coursesRes = await fetch("/api/syncCanvas");
      if (!coursesRes.ok) return;
      const courses: any[] = await coursesRes.json();

      const formattedCourses = courses.map((c) => ({
        code: c.id.toString(),
        name: c.name || "Sin nombre",
        semesterId,
      }));

      const { data: insertedCourses } = await supabase
        .from("Course")
        .upsert(formattedCourses, { onConflict: "code,semesterId" })
        .select();

      if (!insertedCourses) return;

      const eventsRes = await fetch("/api/calendar-events");
      if (!eventsRes.ok) return;
      const events: any[] = await eventsRes.json();

      const activeAssignments = events.map((event) => {
        const courseCanvasId = event.url?.match(/\/courses\/(\d+)/)?.[1];
        const matchingCourse = insertedCourses.find((c) => c.code === courseCanvasId);
        return matchingCourse
          ? {
              title: event.title || "Sin nombre",
              dueDate: event.start,
              courseId: matchingCourse.id,
            }
          : null;
      }).filter((e): e is NonNullable<typeof e> => e !== null);

      if (activeAssignments.length > 0) {
        await supabase
          .from("Assignment")
          .upsert(activeAssignments, { onConflict: "title,courseId" })
          .select();
      }

      setSynced(true);
    };

    sync();
  }, [user, synced]);

  return null;
}
