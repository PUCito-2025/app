"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type CourseWithPlans = {
  id: number;
  name: string;
  code: string;
  StudyPlan: {
    id: number;
    studiedHours: number;
    recommendedHours: number;
    planDate: string;
  }[];
};

export default function StudyTracker() {
  const [courses, setCourses] = useState<CourseWithPlans[]>([]);
  const [hoursInput, setHoursInput] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const week = [...Array(7)].map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date.toISOString().split("T")[0]; // 'YYYY-MM-DD'
  });

  useEffect(() => {
    async function fetchCourses() {
      const { data, error } = await supabase
        .from("Course")
        .select("id, name, code, StudyPlan(id, studiedHours, recommendedHours, planDate)");

      if (error) {
        console.error("Error fetching courses:", error);
      } else {
        setCourses(data || []);
      }
      setLoading(false);
    }

    fetchCourses();
  }, []);

  const handleRegisterHours = async (courseId: number, date: string) => {
    const key = `${courseId}-${date}`;
    const hours = parseFloat(hoursInput[key] || "0");
    if (isNaN(hours)) return;

    const { data: existing, error: findError } = await supabase
      .from("StudyPlan")
      .select("*")
      .eq("courseId", courseId)
      .eq("planDate", date)
      .single();

    if (findError && findError.code !== "PGRST116") {
      console.error("Error checking existing plan:", findError);
      return;
    }

    if (existing) {
      await supabase
        .from("StudyPlan")
        .update({ studiedHours: existing.studiedHours + hours })
        .eq("id", existing.id);
    } else {
      await supabase.from("StudyPlan").insert({
        courseId,
        planDate: date,
        studiedHours: hours,
        recommendedHours: 0, // or customize
        userId: "dev-user",  // replace with auth user ID if available
      });
    }

    setHoursInput((prev) => ({ ...prev, [key]: "" }));
    location.reload(); // Refresh view; you can improve this with a re-fetch instead
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="space-y-10 p-6">
      {courses.map((course) => (
        <Card key={course.id} className="bg-white shadow rounded-2xl p-4">
          <CardContent>
            <h2 className="text-xl font-bold mb-4">
              {course.name} ({course.code})
            </h2>
            <div className="grid grid-cols-7 gap-2 text-center">
              {week.map((day) => {
                const plan = course.StudyPlan.find((p) => p.planDate.startsWith(day));
                const studied = plan?.studiedHours ?? 0;
                const recommended = plan?.recommendedHours ?? 0;
                const key = `${course.id}-${day}`;

                return (
                  <div key={day} className="rounded-xl bg-blue-100 p-2 text-sm">
                    <div>{new Date(day).toLocaleDateString("es-CL", { weekday: "short" })}</div>
                    <div>Recomendado: {recommended}</div>
                    <div>Estudiado: {studied}</div>
                    <Input
                      type="number"
                      min="0"
                      value={hoursInput[key] || ""}
                      onChange={(e) =>
                        setHoursInput((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder="Horas"
                      className="mt-1"
                    />
                    <Button
                      size="sm"
                      className="mt-1"
                      onClick={() => handleRegisterHours(course.id, day)}
                    >
                      Registrar
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
