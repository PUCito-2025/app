"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays } from "date-fns";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StudyPlanner() {
  const { user, isLoaded } = useUser();
  const userId = user?.id;

  const [courses, setCourses] = useState<any[]>([]);
  const [studyPlans, setStudyPlans] = useState<any[]>([]);
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
      const [{ data: cData }, { data: pData }] = await Promise.all([
        supabase.from("Course").select("id, name, code"),
        supabase.from("StudyPlan").select("*").eq("userId", userId),
      ]);
      setCourses(cData || []);
      setStudyPlans(pData || []);
      setLoading(false);
    })();
  }, [userId]);

  // Registrar horas: create o update, y actualizar estado local
  const handleRegister = async () => {
    if (!selectedCourse || !date || !hours || !userId) return;
    const courseId = parseInt(selectedCourse, 10);

    // Busca plan existente sin excepción si no existe
    const { data: existingPlan, error: fetchError } = await supabase
      .from("StudyPlan")
      .select("*")
      .eq("courseId", courseId)
      .eq("planDate", date)
      .eq("userId", userId)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error buscando plan:", fetchError);
      return;
    }

    let res;
    if (existingPlan) {
      // Update
      res = await supabase
        .from("StudyPlan")
        .update({ studiedHours: existingPlan.studiedHours + parseInt(hours, 10) })
        .eq("id", existingPlan.id)
        .select()
        .maybeSingle();
    } else {
      // Insert
      res = await supabase
        .from("StudyPlan")
        .insert({
          courseId,
          userId,
          planDate: date,
          studiedHours: parseInt(hours, 10),
          recommendedHours: 0,
        })
        .select()
        .maybeSingle();
    }

    if (res.error) {
      console.error("Error guardando plan:", res.error);
      return;
    }

    // Actualiza estado local sin recargar
    setStudyPlans((prev) => {
      if (existingPlan) {
        return prev.map((p) => (p.id === existingPlan.id ? res.data! : p));
      }
      return [...prev, res.data!];
    });

    setHours("");
  };

  if (!isLoaded) return <p>Cargando usuario…</p>;
  if (!userId) return <p>Por favor inicia sesión para ver tu planificación.</p>;
  if (loading) return <p>Cargando planificación…</p>;

  // Genera fechas de la semana
  const weekDates = [...Array(7)].map((_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd")
  );

  return (
    <div className="p-6 space-y-6">
      {/* Formulario de registro */}
      <Card className="mx-auto max-w-4xl">
        <CardContent className="flex flex-col sm:flex-row sm:space-x-4 gap-4 justify-center items-center w-full">
          <select
            className="p-2 border rounded w-full sm:w-1/4"
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
          <Input
            type="date"
            className="w-full sm:w-1/4"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Horas"
            className="w-full sm:w-1/4"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <Button onClick={handleRegister}>Registrar</Button>
        </CardContent>
      </Card>

      {/* Navegación de semanas */}
      <div className="flex justify-center items-center space-x-4">
        <Button variant="outline" onClick={() => setWeekStart(ws => addDays(ws, -7))}>
          &lt; Semana anterior
        </Button>
        <span className="font-semibold">
          {format(weekStart, "dd/MM/yyyy")} – {format(addDays(weekStart, 6), "dd/MM/yyyy")}
        </span>
        <Button variant="outline" onClick={() => setWeekStart(ws => addDays(ws, +7))}>
          Semana siguiente &gt;
        </Button>
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7 gap-4 max-w-6xl mx-auto">
        {weekDates.map((day) => (
          <div key={day} className="bg-blue-100 p-4 rounded-xl min-h-[150px]">
            <div className="font-bold text-sm mb-3">
              {format(new Date(day), "EEE dd/MM")}
            </div>
            <div className="space-y-3 text-sm">
              {courses.map((course) => {
                const p = studyPlans.find(sp => {
                  const planKey = sp.planDate.split("T")[0];
                  return (
                    sp.courseId === course.id &&
                    planKey === day &&
                    sp.userId === userId
                  );
                });
                const studied = p?.studiedHours ?? 0;
                const recommended = p?.recommendedHours ?? 0;
                const isMissing = studied < recommended;

                return (
                  <div
                    key={course.id}
                    className={`p-2 rounded shadow ${
                      isMissing
                        ? "bg-red-100 border border-red-400"
                        : "bg-white"
                    }`}
                  >
                    <p className="font-medium text-blue-600">
                      {course.name} ({course.code})
                    </p>
                    <p>
                      Estudiado: <strong>{studied}h</strong> / Recomendado: <strong>{recommended}h</strong>
                    </p>
                    {isMissing && (
                      <p className="text-xs text-red-600 font-semibold">
                        ¡Horas insuficientes!
                      </p>
                    )}
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
