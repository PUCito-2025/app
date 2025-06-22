"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { format, addDays } from "date-fns";
import CardCourse from "@/components/CardCourse";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Combined Monitoreo and CanvasInfoPage
export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  // State for monitoring
  const [courses, setCourses] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [monitorLoading, setMonitorLoading] = useState(true);

  // State for grades
  const [grades, setGrades] = useState<any[]>([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Week start for monitoring
  const [weekStart, setWeekStart] = useState(new Date());
  useEffect(() => {
    const d = new Date();
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    setWeekStart(addDays(d, diff));
  }, []);

  // Fetch monitoring data
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
      if (!cError && !pError) {
        setCourses(cData || []);
        setStudyPlans(pData || []);
      }
      setMonitorLoading(false);
    })();
  }, [userId, weekStart]);

  // Fetch grades data
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const res = await fetch('/api/calificaciones');
      const data = await res.json();
      setGrades(data);
      setGradesLoading(false);
    })();
  }, [userId]);

  if (!isLoaded) return <p>Cargando usuario…</p>;
  if (!userId) return <p>Por favor inicia sesión para ver tu dashboard.</p>;

  // Prepare monitoring chart data
  const monitorData = courses.map(course => {
    const total = studyPlans
      .filter(p => p.courseId === course.id)
      .reduce((sum, p) => sum + p.studiedHours, 0);
    return { name: `${course.name} (${course.code})`, hours: total };
  });

  // Grades for selected course
  const gradesByCourse = selectedCourse
    ? grades.filter(g => g.context_name === selectedCourse.name)
    : [];
  const totalScore = gradesByCourse.reduce((sum, g) => sum + g.score, 0);
  const totalMax = gradesByCourse.reduce((sum, g) => sum + g.max_score, 0);

  return (
    <div className="p-6 space-y-8">
      {/* Monitoreo Section */}
      <div>
        <h2 className="text-2xl font-bold">Monitoreo Semanal</h2>
        <p className="text-sm text-gray-600">
          Del {format(weekStart, 'dd/MM/yyyy')} al {format(addDays(weekStart, 6), 'dd/MM/yyyy')}
        </p>
        {monitorLoading ? (
          <p>Cargando monitoreo…</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monitorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Grades Section */}
      <div>
        <h2 className="text-2xl font-bold">Calificaciones</h2>
        {gradesLoading ? (
          <p>Cargando calificaciones…</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
              <li key={course.id}>
                <button
                  className="w-full text-left"
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardCourse
                    id={course.id}
                    name={course.name}
                    courseCode={course.code}
                    workFlowState=""
                    selected={selectedCourse?.id === course.id}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedCourse && !gradesLoading && (
          <div className="mt-6 space-y-4">
            <h3 className="text-xl font-semibold">
              {selectedCourse.name} — Total: {totalScore}/{totalMax}
            </h3>
            <ul className="space-y-2">
              {gradesByCourse.map(g => (
                <li key={g.id} className="p-4 bg-white rounded shadow">
                  <p className="font-semibold">{g.score} / {g.max_score}</p>
                  <p className="text-sm text-gray-500">Entrega: {new Date(g.due_at).toLocaleString('es-CL')}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
