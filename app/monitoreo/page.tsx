// To use this page, first install Recharts:
// npm install recharts

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { format, addDays } from "date-fns";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Monitoreo page: displays bar chart of hours studied this week by course
export default function Monitoreo() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const [courses, setCourses] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine start of current week (Monday)
  const [weekStart, setWeekStart] = useState(new Date());
  useEffect(() => {
    const d = new Date();
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    setWeekStart(addDays(d, diff));
  }, []);

  // Fetch courses and this week's study plans
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ data: cData, error: cError }, { data: pData, error: pError }] = await Promise.all([
        supabase.from("Course").select("id, name, code"),
        supabase
          .from("StudyPlan")
          .select("courseId, studiedHours, planDate")
          .eq("userId", userId)
          .gte("planDate", format(weekStart, "yyyy-MM-dd"))
          .lte("planDate", format(addDays(weekStart, 6), "yyyy-MM-dd")),
      ]);
      if (cError || pError) {
        console.error("Error loading monitoring data:", cError ?? pError);
      } else {
        setCourses(cData || []);
        setStudyPlans(pData || []);
      }
      setLoading(false);
    })();
  }, [userId, weekStart]);

  if (!isLoaded) return <p>Cargando usuario…</p>;
  if (!userId) return <p>Por favor inicia sesión para ver tu rendimiento.</p>;
  if (loading) return <p>Cargando datos…</p>;

  // Aggregate total hours studied per course this week
  const data = courses.map((course) => {
    const total = studyPlans
      .filter((p) => p.courseId === course.id)
      .reduce((sum, p) => sum + p.studiedHours, 0);
    return { name: `${course.name} (${course.code})`, hours: total };
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Monitoreo Semanal</h2>
      <p className="text-sm text-gray-600 mb-4">Del {format(weekStart, "dd/MM/yyyy")} al {format(addDays(weekStart, 6), "dd/MM/yyyy")}</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="hours" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
