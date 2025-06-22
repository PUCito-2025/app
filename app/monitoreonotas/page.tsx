"use client";

import { useEffect, useState } from "react";

import CardCourse from "@/components/CardCourse";
import "react-calendar/dist/Calendar.css"; // remove calendar if not used

// Types

type Course = {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
};

type Grade = {
  id: number;
  score: number;
  max_score: number;
  due_at: string;
  context_name: string;
};

export default function CanvasInfoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    // Fetch courses
    (async () => {
      try {
        const res = await fetch("/api/canvas");
        const data: Course[] = await res.json();
        const unique = Array.from(new Map(data.map(c => [c.id, c])).values());
        setCourses(unique);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourses(false);
      }
    })();

    // Fetch grades
    (async () => {
      try {
        const res = await fetch("/api/calificaciones");
        const data: Grade[] = await res.json();
        setGrades(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingGrades(false);
      }
    })();
  }, []);

  const gradesByCourse = selectedCourse
    ? grades.filter(g => g.context_name === selectedCourse.name)
    : [];

  // Calculate total score and max for selected course
  const totalScore = gradesByCourse.reduce((sum, g) => sum + g.score, 0);
  const totalMax = gradesByCourse.reduce((sum, g) => sum + g.max_score, 0);

  return (
    <div className="p-6">
      <h1 className="mb-4 text-3xl font-bold">Tus cursos y Calificaciones en Canvas</h1>
      <h2 className="mb-4 text-3xl font-bold">Presiona algún curso para conocer tu calificación</h2>

      {loadingCourses ? (
        <p>Cargando cursos...</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <li key={course.id}>
              <button
                type="button"
                onClick={() => setSelectedCourse(course)}
                className="w-full text-left"
              >
                <CardCourse
                  id={course.id}
                  name={course.name}
                  courseCode={course.course_code}
                  workFlowState={course.workflow_state}
                  selected={selectedCourse?.id === course.id}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedCourse && (
        <div className="mt-10">
          <h2 className="mb-2 text-xl font-semibold">
            Calificaciones de <span className="text-blue-600">{selectedCourse.name}</span>
          </h2>

          {loadingGrades ? (
            <p>Cargando calificaciones...</p>
          ) : gradesByCourse.length === 0 ? (
            <p className="text-gray-500">No hay calificaciones para este curso.</p>
          ) : (
            <div className="space-y-4">
              <p className="font-medium">
                Total: <strong>{totalScore}</strong> / <strong>{totalMax}</strong>
              </p>
              <ul className="space-y-2">
                {gradesByCourse.map(g => (
                  <li
                    key={`grade-${g.id}`}
                    className="rounded border bg-white p-4 shadow-sm"
                  >
                    <p>
                      <span className="font-semibold">{g.score}</span> / {g.max_score}
                    </p>
                    <p className="text-sm text-gray-500">
                      Entrega: {new Date(g.due_at).toLocaleString("es-CL")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
