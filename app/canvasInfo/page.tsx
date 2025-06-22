"use client";
import { useEffect, useState } from "react";
import CardCourse from "@/components/CardCourse";
import EventDot from "@/components/EventDot";
import "react-calendar/dist/Calendar.css";

import GeminiModal from "@/components/GeminiModal";

type Evento = {
  id: number;
  title: string;
  start_at: string;
  context_name: string;
};

type Course = { id: number; name: string; course_code: string; workflow_state: string };
type Assignment = { id: number; name: string; due_at: string | null; course_id: number };

export default function CanvasInfoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pastAssignments, setPastAssignments] = useState<Assignment[] | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState("");
  const simulateStream = async (text: string) => {
    setGeminiResponse("");
    setModalOpen(true);
    for (let i = 0; i < text.length; i++) {
      await new Promise((r) => setTimeout(r, 15));
      setGeminiResponse((prev) => prev + text[i]);
    }
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
  const [loadingEvents, setLoadingEvents ] = useState(true);
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
           <div className="mt-6">
              <button
                onClick={handleGeminiClick}
                disabled={loadingGemini}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                {loadingGemini ? "Consultando..." : "Recomendar con Gemini"}
              </button>
            </div>
        </div>
      )}

      <div className="mt-12">
        <h2 className="mb-4 text-2xl font-semibold">Calendario de Evaluaciones</h2>

        {loadingEvents ? (
          <p>Cargando calendario...</p>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div>
              <Calendar
                onChange={(date) => setSelectedDate(date as Date)}
                value={selectedDate}
                tileContent={renderTileContent(events)}
              />
            </div>

            <div className="flex-1">
              {selectedDate && (
                <>
                  <h3 className="mb-2 text-lg font-medium">
                    Evaluaciones para {selectedDate.toLocaleDateString("es-CL")}
                  </h3>
                  {eventosDelDia.length === 0 ? (
                    <p className="text-gray-500">No hay evaluaciones este día.</p>
                  ) : (
                    <ul className="space-y-2">
                      {eventosDelDia.map((ev) => (
                        <li key={`event-${ev.id}-${ev.start_at}`} className="rounded border bg-white p-3 shadow-sm">
                          <p className="font-semibold">{ev.title}</p>
                          <p className="text-sm text-gray-600">Curso: {ev.context_name}</p>
                          <p className="text-sm text-gray-500">
                            Hora: {new Date(ev.start_at).toLocaleTimeString("es-CL")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <GeminiModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        message={geminiResponse}
      />
    </div>
  );
}
