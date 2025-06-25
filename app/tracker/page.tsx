"use client";

import { useUser } from "@clerk/nextjs";
import { addDays, format } from "date-fns";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface StudyPlan {
  id: number;
  courseId: number;
  userId: string;
  planDate: string;
  studiedHours: number;
  recommendedHours: number;
}

export default function StudyPlanner() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const [courses, setCourses] = useState<Course[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(new Date());

  // Ajusta inicio de semana a lunes
  useEffect(() => {
    const d = new Date();
    const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
    setWeekStart(addDays(d, diff));
  }, []);

  // Carga datos de cursos y planes de estudio
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const [coursesRes, studyPlansRes] = await Promise.all([
          fetch("/api/courses"),
          fetch(`/api/study-plans?userId=${userId}`),
        ]);

        const coursesData = await coursesRes.json();
        const studyPlansData = await studyPlansRes.json();

        setCourses(coursesData.courses || []);
        setStudyPlans(studyPlansData.studyPlans || []);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  // Registrar horas: create o update, y actualizar estado local
  const handleRegister = async () => {
    if (!selectedCourse || !date || !hours || !userId) return;
    const courseId = parseInt(selectedCourse, 10);

    try {
      const response = await fetch("/api/study-plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          userId,
          planDate: date,
          studiedHours: parseInt(hours, 10),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save study plan");
      }

      const result = await response.json();
      const updatedPlan = result.studyPlan;

      // Actualiza estado local sin recargar
      setStudyPlans((prev) => {
        const existingIndex = prev.findIndex(
          (p) => p.courseId === courseId && p.planDate.split("T")[0] === date && p.userId === userId,
        );

        if (existingIndex >= 0) {
          // Update existing plan
          const updated = [...prev];
          updated[existingIndex] = updatedPlan;
          return updated;
        }
        // Add new plan
        return [...prev, updatedPlan];
      });

      setHours("");
    } catch (error) {
      // Handle error silently in production
    }
  };

  if (!isLoaded) return <p>Cargando usuario…</p>;
  if (!userId) return <p>Por favor inicia sesión para ver tu planificación.</p>;
  if (loading) return <p>Cargando planificación…</p>;

  // Genera fechas de la semana
  const weekDates = [...Array(7)].map((_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));

  return (
    <div className="space-y-6 p-6">
      {/* Formulario de registro */}
      <Card className="mx-auto max-w-4xl">
        <CardContent>
          <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:space-x-4">
            <select
              className="w-full rounded border p-2 sm:w-1/4"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Selecciona curso</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <Input type="date" className="w-full sm:w-1/4" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input
              type="number"
              placeholder="Horas"
              className="w-full sm:w-1/4"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <Button onClick={handleRegister}>Registrar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Navegación de semanas */}
      <div className="flex items-center justify-center space-x-4">
        <Button variant="outline" onClick={() => setWeekStart((ws) => addDays(ws, -7))}>
          &lt; Semana anterior
        </Button>
        <span className="font-semibold">
          {format(weekStart, "dd/MM/yyyy")} – {format(addDays(weekStart, 6), "dd/MM/yyyy")}
        </span>
        <Button variant="outline" onClick={() => setWeekStart((ws) => addDays(ws, +7))}>
          Semana siguiente &gt;
        </Button>
      </div>

      {/* Calendario */}
      <div className="mx-auto grid max-w-6xl grid-cols-7 gap-4">
        {weekDates.map((day) => (
          <div key={day} className="min-h-[150px] rounded-xl bg-blue-100 p-4">
            <div className="mb-3 text-sm font-bold">{format(new Date(day), "EEE dd/MM")}</div>
            <div className="space-y-3 text-sm">
              {courses.map((course) => {
                const p = studyPlans.find((sp) => {
                  const planKey = sp.planDate.split("T")[0];
                  return sp.courseId === course.id && planKey === day && sp.userId === userId;
                });
                const studied = p?.studiedHours ?? 0;
                const recommended = p?.recommendedHours ?? 0;
                const isMissing = studied < recommended;

                return (
                  <div
                    key={course.id}
                    className={`rounded p-2 shadow ${isMissing ? "border border-red-400 bg-red-100" : "bg-white"}`}
                  >
                    <p className="font-medium text-blue-600">
                      {course.name} ({course.code})
                    </p>
                    <p>
                      Estudiado: <strong>{studied}h</strong> / Recomendado: <strong>{recommended}h</strong>
                    </p>
                    {isMissing && <p className="text-xs font-semibold text-red-600">¡Horas insuficientes!</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
