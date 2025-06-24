"use client";

import { useEffect, useState } from "react";

import CardCourse from "@/components/CardCourse";
import GeminiModal from "@/components/GeminiModal";

type Course = { id: number; name: string; course_code: string; workflow_state: string };
type Assignment = { id: number; name: string; due_at: string | null; course_id: number };

export default function CanvasInfoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState("");

  const simulateStream = async (text: string) => {
    setGeminiResponse("");
    setModalOpen(true);

    const streamText = (index: number) => {
      if (index >= text.length) return;

      setGeminiResponse((prev) => prev + text[index]);

      setTimeout(() => {
        streamText(index + 1);
      }, 15);
    };

    streamText(0);
  };

  const handleGeminiClick = async () => {
    if (!selectedCourse) return;
    setLoadingGemini(true);

    try {
      const prompt = `Responde en no mas de 200 palabras:
        Quiero una recomendación personalizada para el curso "${selectedCourse.name}"
        (Código: ${selectedCourse.course_code}), cuyo estado es "${selectedCourse.workflow_state}".
        ¿Qué estrategias puedo seguir para tener éxito en este curso?`;

      const res = await fetch("/api/recomendations", {
        method: "POST",
        body: JSON.stringify({ prompt }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      await simulateStream(data.data);
    } catch (error) {
      setGeminiResponse("Hubo un error al obtener la recomendación.");
      setModalOpen(true);
    } finally {
      setLoadingGemini(false);
    }
  };

  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/canvas");
        const data = await res.json();
        const unique = Array.from(new Map(data.map((c: Course) => [c.id, c])).values()) as Course[];
        setCourses(unique);
      } catch (e) {
        // Handle error silently for production
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
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-4xl font-bold text-gray-800">Tus cursos en Canvas</h1>

      <ul className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => {
                setSelectedCourse(c);
                fetchAssignments(c.id, filter === "all");
              }}
              className="w-full text-left"
            >
              <CardCourse
                name={c.name}
                courseCode={c.course_code}
                id={c.id}
                workFlowState={c.workflow_state}
                selected={selectedCourse?.id === c.id}
              />
            </button>
          </li>
        ))}
      </ul>

      {selectedCourse && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-700">
                Tareas de <span className="text-blue-600">{selectedCourse.name}</span>
              </h2>
              {userRole && (
                <p className="mt-1 text-sm text-gray-500">
                  Tu rol en el curso: <span className="font-medium">{userRole}</span>
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {["all", "upcoming", "past"].map((f) => {
                const getFilterLabel = (filterType: string) => {
                  if (filterType === "all") return "Todas";
                  if (filterType === "upcoming") return "Próximas";
                  return "Pasadas";
                };

                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setFilter(f as "all" | "upcoming" | "past");
                      if (selectedCourse) fetchAssignments(selectedCourse.id, f === "all");
                    }}
                    className={`rounded px-3 py-1 text-sm ${
                      filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {getFilterLabel(f)}
                  </button>
                );
              })}
            </div>
          </div>

          {(() => {
            if (loadingAssignments) {
              return <p className="text-gray-500">Cargando tareas...</p>;
            }
            if (assignmentError) {
              return <p className="text-red-500">{assignmentError}</p>;
            }
            if (assignments.length === 0) {
              return <p className="text-gray-500">No hay tareas según el filtro seleccionado.</p>;
            }
            return (
              <ul className="space-y-4">
                {assignments.map((a) => (
                  <li
                    key={`${a.id}-${a.due_at}`}
                    className="rounded border bg-white p-4 shadow transition hover:shadow-md"
                  >
                    <p className="text-lg font-semibold text-gray-800">{a.name}</p>
                    <p className="text-sm text-gray-500">
                      Fecha de entrega: {a.due_at ? new Date(a.due_at).toLocaleString("es-CL") : "Sin fecha"}
                    </p>
                  </li>
                ))}
              </ul>
            );
          })()}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGeminiClick}
              disabled={loadingGemini}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              {loadingGemini ? "Consultando..." : "Recomendar con Gemini"}
            </button>
          </div>
        </div>
      )}

      <GeminiModal isOpen={modalOpen} onClose={() => setModalOpen(false)} message={geminiResponse} />
    </div>
  );
}
