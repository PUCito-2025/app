"use client";

import { useEffect, useState } from "react";
import Calendar from "react-calendar";

import EventDot from "@/components/EventDot";
import "react-calendar/dist/Calendar.css";

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

export default function CalendarEvaluaciones() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch("/api/evaluaciones");
      const data = await res.json();
      setEvents(data);
    };

    fetchEvents();
  }, []);

  const eventosDelDia = selectedDate
    ? events.filter((ev) => new Date(ev.start_at).toDateString() === selectedDate.toDateString())
    : [];

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-2xl font-semibold">Calendario de Evaluaciones</h2>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div>
          <Calendar
            onChange={(date) => setSelectedDate(date as Date)}
            value={selectedDate}
            tileContent={renderTileContent(events)}
          />
        </div>

        {/* Lista de evaluaciones del día */}
        <div className="flex-1">
          {selectedDate && (
            <>
              <h3 className="mb-2 text-lg font-medium">Evaluaciones para {selectedDate.toLocaleDateString("es-CL")}</h3>
              {eventosDelDia.length === 0 ? (
                <p className="text-gray-500">No hay evaluaciones este día.</p>
              ) : (
                <ul className="space-y-2">
                  {eventosDelDia.map((ev) => (
                    <li key={`event-${ev.id}`} className="rounded border bg-white p-3">
                      <p className="font-semibold">{ev.title}</p>
                      <p className="text-sm text-gray-600">Curso: {ev.context_name}</p>
                      <p className="text-sm text-gray-500">Hora: {new Date(ev.start_at).toLocaleTimeString("es-CL")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
