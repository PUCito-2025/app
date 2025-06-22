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

  // Monitoring state
  const [courses, setCourses] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [monitorLoading, setMonitorLoading] = useState(true);

  // Grades fetched from Canvas API per course
  const [grades, setGrades] = useState<any[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
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

  // Fetch grades from Canvas API when a course is selected
  useEffect(() => {
    if (!selectedCourse) return;
    setGradesLoading(true);
    (async () => {
      try {
        const token = process.env.NEXT_PUBLIC_CANVAS_TOKEN;
        const baseUrl = process.env.NEXT_PUBLIC_CANVAS_URL;
        const courseId = selectedCourse.id;
        const url = `${baseUrl}/api/v1/courses/${courseId}/students/submissions?per_page=100`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const text = await res.text();
          console.error(`Canvas API error (${res.status}):`, text);
          setGrades([]);
        } else {
          let json: any;
          try {
            json = await res.json();
          } catch (err) {
            const text = await res.text();
            console.error('Invalid JSON from Canvas API:', text);
            json = [];
          }
          const gradesData = Array.isArray(json)
            ? json.map((s: any) => ({
                id: s.id,
                score: s.score ?? 0,
                max_score: s.max_score ?? s['max_score'] ?? 0,
                due_at: s.submitted_at || s.workflow_state || '',
                context_name: selectedCourse.name,
              }))
            : [];
          setGrades(gradesData);
        }
      } catch (error) {
        console.error('Fetch Canvas API failed:', error);
        setGrades([]);
      } finally {
        setGradesLoading(false);
      }
    })();
  }, [selectedCourse]);

  if (!isLoaded) return <p>Cargando usuario…</p>;
  if (!userId) return <p>Por favor inicia sesión para ver tu dashboard.</p>;

  // Prepare monitoring chart data
  const monitorData = courses.map(course => {
    const total = studyPlans
      .filter(p => p.courseId === course.id)
      .reduce((sum, p) => sum + p.studiedHours, 0);
    return { name: `${course.name} (${course.code})`, hours: total };
  });

  // Grades stats
  const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
  const totalMax = grades.reduce((sum, g) => sum + g.max_score, 0);

  return (
    <div className="p-6 space-y-8">
    
      {/* Grades Section */}
      <div>
        <h2 className="text-2xl font-bold">Calificaciones</h2>
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
        {selectedCourse && (
          <div className="mt-6 space-y-4">
            {gradesLoading ? (
              <p>Cargando calificaciones…</p>
            ) : grades.length === 0 ? (
              <p>No hay calificaciones para este curso.</p>
            ) : (
              <div>
                <p className="font-medium">
                  Total: <strong>{totalScore}</strong> / <strong>{totalMax}</strong>
                </p>
                <ul className="space-y-2">
                  {grades.map(g => (
                    <li key={g.id} className="p-4 bg-white rounded shadow">
                      <p className="font-semibold">{g.score} / {g.max_score}</p>
                      <p className="text-sm text-gray-500">
                        Entrega: {new Date(g.due_at).toLocaleString('es-CL')}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
