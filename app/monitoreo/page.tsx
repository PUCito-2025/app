/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable camelcase */

"use client";

import { useUser } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { addDays, format } from "date-fns";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import CardCourse from "@/components/CardCourse";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const [courses, setCourses] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
  const [monitorLoading, setMonitorLoading] = useState(true);

  const [grades, setGrades] = useState<any[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  const [weekStart, setWeekStart] = useState(new Date());
  useEffect(() => {
    const d = new Date();
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    setWeekStart(addDays(d, diff));
  }, []);

  useEffect(() => {
    if (!userId || !supabase) return;
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

  useEffect(() => {
    if (!selectedCourse) return;
    setGradesLoading(true);
    (async () => {
      try {
        const token = process.env.NEXT_PUBLIC_CANVAS_TOKEN;
        const baseUrl = process.env.NEXT_PUBLIC_CANVAS_URL;
        const res = axios.get(`${baseUrl}/api/v1/courses/${selectedCourse.code}/assignments/all/submissions`, {
          // eslint-disable-next-line prettier/prettier
          params: { "student_ids": [userId] },
          headers: { Authorization: `Bearer ${token}` },
        });
        const { data } = await res;

        const gradesData = Array.isArray(data)
          ? data.map((s) => ({
              id: s.id,
              score: s.score ?? 0,
              max_score: s.assignment?.points_possible ?? 0,
              due_at: s.submitted_at || s.workflow_state || "",
            }))
          : [];

        setGrades(gradesData);
      } catch (error) {
        console.error("Fetch Canvas API failed:", error);
        setGrades([]);
      } finally {
        setGradesLoading(false);
      }
    })();
  }, [selectedCourse, userId]);

  if (!isLoaded) return <p>Cargando usuario…</p>;
  if (!userId) return <p>Por favor inicia sesión para ver tu dashboard.</p>;

  const monitorData = courses.map((course) => {
    const total = studyPlans.filter((p) => p.courseId === course.id).reduce((sum, p) => sum + p.studiedHours, 0);
    return { name: `${course.name} (${course.code})`, hours: total };
  });

  const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
  const totalMax = grades.reduce((sum, g) => sum + g.max_score, 0);

  return (
    <div className="space-y-12 p-6">
      {/* Sección 1: Monitoreo de horas */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Monitoreo Semanal de Horas Estudiadas</h2>
        {monitorLoading ? (
          <p>Cargando datos…</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monitorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sección 2: Calificaciones */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Monitoreo de Calificaciones</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id}>
              <button className="w-full text-left" onClick={() => setSelectedCourse(course)} type="button">
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
            {gradesLoading && <p>Cargando calificaciones…</p>}
            {!gradesLoading && grades.length === 0 && <p>No hay calificaciones disponibles para este curso.</p>}
            {!gradesLoading && grades.length > 0 && (
              <div>
                <p className="font-medium">
                  Total: <strong>{totalScore}</strong> / <strong>{totalMax}</strong>
                </p>
                <ul className="space-y-2">
                  {grades.map((g) => (
                    <li key={g.id} className="rounded bg-white p-4 shadow">
                      <p className="font-semibold">
                        {g.score} / {g.max_score}
                      </p>
                      <p className="text-sm text-gray-500">Entregado: {new Date(g.due_at).toLocaleString("es-CL")}</p>
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
