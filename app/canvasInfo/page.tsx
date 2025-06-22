"use client";
import { useEffect, useState } from "react";
import CardCourse from "@/components/CardCourse";

type Course = { id: number; name: string; course_code: string; workflow_state: string };
type Assignment = { id: number; name: string; due_at: string | null; course_id: number };

export default function CanvasInfoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pastAssignments, setPastAssignments] = useState<Assignment[] | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/canvas");
        const data = await res.json();
        const unique = Array.from(new Map(data.map((c: Course) => [c.id, c])).values());
        setCourses(unique);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  const fetchAssignments = async (courseId: number, includePast = false) => {
    setLoadingAssignments(true);
    setAssignmentError(null);
    try {
      const res = await fetch(`/api/evaluaciones?courseId=${courseId}&includePast=${includePast}`);
      const data = await res.json();

      if (res.status === 403) {
        setAssignmentError("No tienes acceso a las tareas de este curso");
        setAssignments([]);
        setUserRole(null);
      } else if (data.error) {
        setAssignmentError(data.error);
        setAssignments([]);
        setUserRole(null);
      } else {
        setAssignments(data.tasks);
        setPastAssignments(data.allTasks || null);
        setUserRole(data.role || null);
      }
    } catch (e) {
      setAssignmentError("Error al obtener tareas");
      setAssignments([]);
      setUserRole(null);
    } finally {
      setLoadingAssignments(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Tus cursos en Canvas</h1>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {courses.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => {
                setSelectedCourse(c);
                fetchAssignments(c.id, filter === "all");
              }}
              className="w-full text-left"
            >
              <CardCourse {...c} selected={selectedCourse?.id === c.id} />
            </button>
          </li>
        ))}
      </ul>

      {selectedCourse && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-700">
                Tareas de <span className="text-blue-600">{selectedCourse.name}</span>
              </h2>
              {userRole && (
                <p className="text-sm text-gray-500 mt-1">Tu rol en el curso: <span className="font-medium">{userRole}</span></p>
              )}
            </div>
            <div className="flex space-x-2">
              {["all", "upcoming", "past"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f as any);
                    if (selectedCourse) fetchAssignments(selectedCourse.id, f === "all");
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {f === "all" ? "Todas" : f === "upcoming" ? "Próximas" : "Pasadas"}
                </button>
              ))}
            </div>
          </div>

          {loadingAssignments ? (
            <p className="text-gray-500">Cargando tareas...</p>
          ) : assignmentError ? (
            <p className="text-red-500">{assignmentError}</p>
          ) : assignments.length === 0 ? (
            <p className="text-gray-500">No hay tareas según el filtro seleccionado.</p>
          ) : (
            <ul className="space-y-4">
              {assignments.map((a) => (
                <li
                  key={`${a.id}-${a.due_at}`}
                  className="rounded border bg-white p-4 shadow hover:shadow-md transition"
                >
                  <p className="text-lg font-semibold text-gray-800">{a.name}</p>
                  <p className="text-sm text-gray-500">
                    Fecha de entrega:{" "}
                    {a.due_at
                      ? new Date(a.due_at).toLocaleString("es-CL")
                      : "Sin fecha"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
