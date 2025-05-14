"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";

import CardCourse from "@/components/CardCourse";
import EventDot from "@/components/EventDot";
import "react-calendar/dist/Calendar.css";

type Course = {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
};

type Evento = {
  id: number;
  title: string;
  start_at: string;
  context_name: string;
};

function renderTileContent(events: Evento[]) {
  return ({ date, view }: { date: Date; view: string }) =>
    view === "month" ? <EventDot date={date} events={events} /> : null;
}

export default function CanvasInfoPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/canvas");
        const data = await res.json();
        const uniqueCourses = Array.from(new Map(data.map((c: Course) => [c.id, c])).values()) as Course[];
        setCourses(uniqueCourses);
      } catch (err) {
        // console.error('Error al obtener cursos:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/evaluaciones");
        const data = await res.json();
        const uniqueEvents = Array.from(new Map(data.map((e: Evento) => [`${e.id}-${e.start_at}`, e])).values());
        setEvents(uniqueEvents as Evento[]);
      } catch (err) {
        // console.error('Error al obtener evaluaciones:', err);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchCourses();
    fetchEvents();
  }, []);

  const eventosDelDia = selectedDate
    ? events.filter((ev) => new Date(ev.start_at).toDateString() === selectedDate.toDateString())
    : [];

  const eventosDelCurso = selectedCourse ? events.filter((ev) => ev.context_name === selectedCourse.name) : [];

  return (
    <div className="p-6">
      <h1 className="mb-4 text-3xl font-bold">Tus cursos en Canvas</h1>

      {loadingCourses ? (
        <p>Cargando cursos...</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <li key={`course-${course.id}`}>
              <button type="button" onClick={() => setSelectedCourse(course)} className="w-full text-left">
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
            Evaluaciones próximas de <span className="text-blue-600">{selectedCourse.name}</span>
          </h2>
          {eventosDelCurso.length === 0 ? (
            <p className="text-gray-500">No hay evaluaciones para este curso.</p>
          ) : (
            <ul className="space-y-2">
              {eventosDelCurso.map((ev) => (
                <li key={`curso-event-${ev.id}`} className="rounded border bg-white p-3 shadow-sm">
                  <p className="font-semibold">{ev.title}</p>
                  <p className="text-sm text-gray-500">Fecha: {new Date(ev.start_at).toLocaleString("es-CL")}</p>
                </li>
              ))}
            </ul>
          )}
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
    </div>
  );
}
