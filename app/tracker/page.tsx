"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

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

  // Generate an array of 7 days (ISO strings) starting from today
  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      const { data: courseData, error: courseError } = await supabase
        .from("Course")
        .select("id, name, code");

      const { data: planData, error: planError } = await supabase
        .from("StudyPlan")
        .select("*")
        .eq("userId", userId);

      if (!courseError && !planError) {
        setCourses(courseData || []);
        setStudyPlans(planData || []);
      } else {
        console.error("Error fetching data:", courseError ?? planError);
      }

      setLoading(false);
    };

    fetchData();
  }, [userId]);

  const handleRegister = async () => {
    if (!selectedCourse || !date || !hours || !userId) return;
    const courseId = parseInt(selectedCourse);

    // Check if a StudyPlan exists for this course, date and user
    const { data: existing, error: findError } = await supabase
      .from("StudyPlan")
      .select("*")
      .eq("courseId", courseId)
      .eq("planDate", date)
      .eq("userId", userId)
      .single();

    if (findError && findError.code !== "PGRST116") {
      // PGRST116 = no rows found (PostgREST error)
      console.error("Error finding plan:", findError);
      return;
    }

    if (existing) {
      // Update existing record adding hours
      await supabase
        .from("StudyPlan")
        .update({ studiedHours: existing.studiedHours + parseInt(hours) })
        .eq("id", existing.id);
    } else {
      // Insert new record with studied hours, recommendedHours default to 0
      await supabase.from("StudyPlan").insert({
        courseId,
        userId,
        planDate: date,
        studiedHours: parseInt(hours),
        recommendedHours: 0,
      });
    }

    // Clear inputs and reload data
    setSelectedCourse("");
    setDate("");
    setHours("");
    setLoading(true);
    const { data: updatedPlans } = await supabase
      .from("StudyPlan")
      .select("*")
      .eq("userId", userId);
    setStudyPlans(updatedPlans || []);
    setLoading(false);
  };

  if (!isLoaded) return <p>Cargando usuario...</p>;
  if (!userId) return <p>Por favor inicia sesión para ver tu planificación.</p>;
  if (loading) return <p>Cargando planificación...</p>;

  return (
    <div className="p-6 space-y-8">
      {/* Register Form */}
      <Card className="p-4">
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
          <select
            className="p-2 border rounded w-full sm:w-1/4"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Selecciona curso</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
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
            placeholder="Horas estudiadas"
            className="w-full sm:w-1/4"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <Button onClick={handleRegister}>Registrar</Button>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((day) => (
          <div key={day} className="bg-blue-100 p-4 rounded-xl min-h-[150px]">
            <div className="font-bold text-sm mb-3">
              {format(new Date(day), "EEEE dd/MM")}
            </div>
            <div className="space-y-3 text-sm">
              {courses.map((course) => {
                const match = studyPlans.find(
                  (p) =>
                    p.courseId === course.id &&
                    p.planDate.startsWith(day) &&
                    p.userId === userId
                );
                const studied = match?.studiedHours ?? 0;
                const recommended = match?.recommendedHours ?? 0;

                const isMissing = studied < recommended;

                return (
                  <div
                    key={course.id}
                    className={`p-2 rounded shadow ${
                      isMissing ? "bg-red-100 border border-red-400" : "bg-white"
                    }`}
                  >
                    <p className="font-medium">
                      {course.name} ({course.code})
                    </p>
                    <p>
                      Estudiado: <strong>{studied}h</strong> / Recomendado:{" "}
                      <strong>{recommended}h</strong>
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
